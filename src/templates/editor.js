window.MonacoEnvironment = {
  getWorkerUrl(_moduleId, label) {
    const base = './vendor/monaco/vs';
    if (label === 'json') return `${base}/language/json/jsonWorker.js`;
    if (label === 'css' || label === 'scss' || label === 'less')
      return `${base}/language/css/cssWorker.js`;
    if (label === 'html' || label === 'handlebars' || label === 'razor')
      return `${base}/language/html/htmlWorker.js`;
    if (label === 'typescript' || label === 'javascript')
      return `${base}/language/typescript/tsWorker.js`;
    return `${base}/editor/editorWorkerService.js`;
  },
};

require.config({ paths: { vs: './vendor/monaco/vs' } });

require(['vs/editor/editor.main'], () => {
  // Register all community themes from the pre-built bundle before any editor is created
  if (window.__monacoThemes) {
    for (const [name, data] of Object.entries(window.__monacoThemes)) {
      try {
        monaco.editor.defineTheme(name, data);
      } catch (e) {
        console.warn(`popcorn: skipping theme "${name}" — ${e.message}`);
      }
    }
  }

  // Map of filename → { model, language }
  const files = new Map();

  // paneIndex → editor instance
  const paneEditors = new Map();

  // paneIndex → active filename
  const paneActiveFile = new Map();

  let activePane = 0;
  let paneCount = 1;
  let annotateFontSize = null;

  // Tracks ALL options from the Editor {} DSL block — including theme —
  // so every createEditor() call (initial pane and split panes) uses the
  // same configuration. theme must live here because monaco.editor.create()
  // with a hardcoded theme resets the global Monaco theme for all editors.
  let currentEditorOptions = {
    theme: 'vs-dark',
    tabSize: 2,
    insertSpaces: true,
  };

  // ------------------------------------------------------------------
  // Sync Monaco theme colors to CSS custom properties on :root so that
  // the title bar and tab bars stay in sync with the active theme.
  // Monaco injects all theme colors as --vscode-* CSS custom properties
  // on .monaco-editor elements.
  // ------------------------------------------------------------------
  function syncTheme() {
    const editorEl = document.querySelector('.monaco-editor');
    if (!editorEl) return;

    const monacoStyle = getComputedStyle(editorEl);
    const get = (varName) => monacoStyle.getPropertyValue(varName).trim() || null;
    const root = document.documentElement;

    const titleBarBg      = get('--vscode-titleBar-activeBackground');
    const titleBarFg      = get('--vscode-titleBar-activeForeground');
    const tabBarBg        = get('--vscode-editorGroupHeader-tabsBackground');
    const tabInactiveBg   = get('--vscode-tab-inactiveBackground');
    const tabActiveBg     = get('--vscode-tab-activeBackground');
    const tabInactiveFg   = get('--vscode-tab-inactiveForeground');
    const tabActiveFg     = get('--vscode-tab-activeForeground');
    const tabActiveBorder = get('--vscode-tab-activeBorderTop');

    if (titleBarBg)      root.style.setProperty('--titlebar-bg', titleBarBg);
    if (titleBarFg)      root.style.setProperty('--titlebar-fg', titleBarFg);
    if (tabBarBg)        root.style.setProperty('--tabbar-bg', tabBarBg);
    if (tabInactiveBg)   root.style.setProperty('--tab-inactive-bg', tabInactiveBg);
    if (tabActiveBg)     root.style.setProperty('--tab-active-bg', tabActiveBg);
    if (tabInactiveFg)   root.style.setProperty('--tab-inactive-fg', tabInactiveFg);
    if (tabActiveFg)     root.style.setProperty('--tab-active-fg', tabActiveFg);
    if (tabActiveBorder) root.style.setProperty('--tab-active-border-top', tabActiveBorder);
  }

  // ------------------------------------------------------------------
  // Editor factory — driven entirely by currentEditorOptions
  // ------------------------------------------------------------------
  function createEditor(containerId) {
    const container = document.getElementById(containerId);
    // language is intentionally omitted here: it is set per-model by
    // openFile() via inferLanguage(), so the initial 'plaintext' default
    // from monaco.editor.create is immediately replaced.
    const { language: _lang, ...opts } = currentEditorOptions;
    return monaco.editor.create(container, {
      value: '',
      automaticLayout: true,
      ...opts,
    });
  }

  // ------------------------------------------------------------------
  // Tab bar helpers
  // ------------------------------------------------------------------
  function updateTabBar(paneIndex, filename) {
    const bar = document.getElementById(`tab-bar-${paneIndex}`);
    if (!bar) return;

    bar.querySelectorAll('.tab').forEach((t) => t.classList.remove('active'));

    let tab = bar.querySelector(`[data-file="${CSS.escape(filename)}"]`);
    if (!tab) {
      tab = document.createElement('div');
      tab.className = 'tab';
      tab.dataset.file = filename;
      tab.textContent = filename;
      bar.appendChild(tab);
    }
    tab.classList.add('active');
    paneActiveFile.set(paneIndex, filename);

    // Update window title to the focused file
    document.getElementById('window-title').textContent = filename;
  }

  // ------------------------------------------------------------------
  // Initialise pane 0
  // ------------------------------------------------------------------
  paneEditors.set(0, createEditor('container-0'));
  syncTheme();

  // ==================================================================
  // window.__popcorn public API
  // ==================================================================
  window.__popcorn = {
    // Apply Monaco editor options from the Editor {} DSL block.
    // Persists ALL options (including theme) into currentEditorOptions so
    // that every future createEditor() call — including split panes — gets
    // the full user-defined configuration from the start.
    applyOptions(opts) {
      const { theme, language, ...editorOpts } = opts;

      // Persist everything, including theme, for future createEditor() calls
      currentEditorOptions = { ...currentEditorOptions, ...opts };

      if (theme) {
        monaco.editor.setTheme(theme);
        syncTheme();
      }

      paneEditors.forEach((ed) => {
        if (language) monaco.editor.setModelLanguage(ed.getModel(), language);
        ed.updateOptions(editorOpts);
      });
    },

    // Open/activate a file in the active pane.
    openFile(filename, language = 'plaintext') {
      const editor = paneEditors.get(activePane);
      if (!editor) return;

      if (files.has(filename)) {
        editor.setModel(files.get(filename).model);
      } else {
        const model = monaco.editor.createModel('', language);
        files.set(filename, { model, language });
        editor.setModel(model);
      }

      updateTabBar(activePane, filename);
    },

    // Type a single character at the cursor position
    typeChar(char) {
      const editor = paneEditors.get(activePane);
      if (editor) editor.trigger('popcorn', 'type', { text: char });
    },

    // Press a named key.
    // Tab reads the live editor options so it respects tabSize / insertSpaces.
    pressKey(key) {
      const editor = paneEditors.get(activePane);
      if (!editor) return;
      switch (key) {
        case 'Enter':
          editor.trigger('keyboard', 'type', { text: '\n' });
          break;
        case 'Tab': {
          const opts = editor.getOptions();
          const useSpaces = opts.get(monaco.editor.EditorOption.insertSpaces);
          const tabSize = opts.get(monaco.editor.EditorOption.tabSize);
          editor.trigger('keyboard', 'type', {
            text: useSpaces ? ' '.repeat(tabSize) : '\t',
          });
          break;
        }
        case 'Backspace':
          editor.trigger('keyboard', 'deleteLeft', null);
          break;
        case 'Delete':
          editor.trigger('keyboard', 'deleteRight', null);
          break;
      }
    },

    // Paste text instantly (no animation)
    pasteText(text) {
      const editor = paneEditors.get(activePane);
      if (!editor) return;
      const selection = editor.getSelection();
      editor.executeEdits('popcorn', [{ range: selection, text, forceMoveMarkers: true }]);
      editor.pushUndoStop();
    },

    // Scroll editor to reveal a specific line
    scrollToLine(line) {
      const editor = paneEditors.get(activePane);
      if (editor) editor.revealLineInCenter(line);
    },

    // Move cursor to a specific line (column 1)
    moveCursorTo(line) {
      const editor = paneEditors.get(activePane);
      if (!editor) return;
      editor.setPosition({ lineNumber: line, column: 1 });
      editor.revealLine(line);
    },

    // Set a selection/highlight range
    setSelection(startLine, startCol, endLine, endCol) {
      const editor = paneEditors.get(activePane);
      if (editor) editor.setSelection(new monaco.Range(startLine, startCol, endLine, endCol));
    },

    // Set the font size used by all subsequent showAnnotation calls.
    // Falls back to the Editor block fontSize, then to the CSS default.
    setAnnotateFontSize(size) {
      annotateFontSize = size;
    },

    // Show annotation overlay
    showAnnotation(text) {
      const el = document.getElementById('annotation-overlay');
      el.textContent = text;
      const size = annotateFontSize ?? currentEditorOptions.fontSize;
      el.style.fontSize = size != null ? `${size}px` : '';
      el.style.display = 'block';
    },

    // Hide annotation overlay
    hideAnnotation() {
      document.getElementById('annotation-overlay').style.display = 'none';
    },

    // Split the view (direction: 'Right' | 'Down')
    split(direction) {
      if (paneCount >= 2) return;
      paneCount = 2;

      const root = document.getElementById('root');
      root.style.flexDirection = direction === 'Down' ? 'column' : 'row';

      const pane = document.createElement('div');
      pane.className = 'editor-pane';
      pane.id = 'pane-1';

      const tabBar = document.createElement('div');
      tabBar.className = 'tab-bar';
      tabBar.id = 'tab-bar-1';

      const container = document.createElement('div');
      container.className = 'editor-container';
      container.id = 'container-1';

      pane.appendChild(tabBar);
      pane.appendChild(container);
      root.appendChild(pane);

      // createEditor merges currentEditorOptions so this pane gets the
      // same font, tabSize, etc. as defined in the Editor {} block.
      paneEditors.set(1, createEditor('container-1'));
      activePane = 1;
    },

    // Remove split, go back to single pane
    unsplit() {
      if (paneCount < 2) return;
      paneCount = 1;
      activePane = 0;

      const pane1 = document.getElementById('pane-1');
      if (pane1) {
        const editor = paneEditors.get(1);
        if (editor) editor.dispose();
        paneEditors.delete(1);
        paneActiveFile.delete(1);
        pane1.remove();
      }

      document.getElementById('root').style.flexDirection = 'row';

      // Restore window title to pane 0's active file
      const file0 = paneActiveFile.get(0);
      if (file0) document.getElementById('window-title').textContent = file0;
    },

    // Set active pane by filename
    focusFile(filename) {
      for (const [paneIdx, editor] of paneEditors.entries()) {
        const entry = files.get(filename);
        if (entry && entry.model === editor.getModel()) {
          activePane = paneIdx;
          editor.focus();
          document.getElementById('window-title').textContent = filename;
          return;
        }
      }
      activePane = 0;
    },

    // Set language on the active file
    setLanguage(language) {
      const editor = paneEditors.get(activePane);
      if (!editor) return;
      const model = editor.getModel();
      if (model) monaco.editor.setModelLanguage(model, language);
    },

    // Get current editor content (for debugging)
    getValue() {
      const editor = paneEditors.get(activePane);
      return editor ? editor.getValue() : '';
    },
  };

  window.__popcornReady = true;
});

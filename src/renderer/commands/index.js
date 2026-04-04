import annotate from './annotate.js';
import backspace from './backspace.js';
import enter from './enter.js';
import file from './file.js';
import focus from './focus.js';
import highlight from './highlight.js';
import moveTo from './move-to.js';
import paste from './paste.js';
import scroll from './scroll.js';
import sleep from './sleep.js';
import split from './split.js';
import tab from './tab.js';
import typeCmd from './type.js';
import unsplit from './unsplit.js';

export const registry = {
  // file-level commands
  Type: typeCmd,
  Paste: paste,
  Enter: enter,
  Tab: tab,
  Backspace: backspace,
  Scroll: scroll,
  MoveTo: moveTo,
  Highlight: highlight,
  Select: highlight,
  // top-level commands
  File: file,
  Split: split,
  Unsplit: unsplit,
  Focus: focus,
  // shared (valid at both levels)
  Sleep: sleep,
  Annotate: annotate,
};

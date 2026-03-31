// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

Program
  = _ statements:TopLevelStatement* {
      return { type: 'Program', statements };
    }

// ---------------------------------------------------------------------------
// Whitespace and comments
// ---------------------------------------------------------------------------

_ "whitespace"
  = ([ \t\n\r] / Comment)*

Comment
  = "#" [^\n]* ("\n" / !.)

// ---------------------------------------------------------------------------
// Top-level statements
// ---------------------------------------------------------------------------

TopLevelStatement
  = ConfigBlock
  / EditorBlock
  / OutputBlock
  / FileBlock
  / SplitCommand
  / UnsplitCommand
  / FocusCommand
  / SleepCommand
  / AnnotateCommand

// ---------------------------------------------------------------------------
// Config block
// ---------------------------------------------------------------------------

ConfigBlock
  = "Config" _ "{" _ settings:ConfigSetting* "}" _ {
      return { type: 'Config', settings: Object.fromEntries(settings) };
    }

ConfigSetting
  = "TypingMode" _ mode:TypingMode _ {
      return ['typingMode', mode];
    }
  / "TypingSpeed" _ speed:Integer _ {
      return ['typingSpeed', speed];
    }
  / "TypingErrorChance" _ chance:Number _ {
      return ['typingErrorChance', chance];
    }

TypingMode
  = "Human" / "Machine" / "Burst"

// ---------------------------------------------------------------------------
// Editor block — free-form JSON passed directly to Monaco editor
// ---------------------------------------------------------------------------

EditorBlock
  = "Editor" _ "{" _ pairs:JsonPair* "}" _ {
      return { type: 'Editor', options: Object.fromEntries(pairs) };
    }

// ---------------------------------------------------------------------------
// Output block
// ---------------------------------------------------------------------------

OutputBlock
  = "Output" _ "{" _ settings:OutputSetting* "}" _ {
      return { type: 'Output', settings: Object.fromEntries(settings) };
    }

OutputSetting
  = "Width" _ value:Integer _ {
      return ['width', value];
    }
  / "Height" _ value:Integer _ {
      return ['height', value];
    }
  / "Fps" _ value:Integer _ {
      return ['fps', value];
    }
  / "Format" _ value:StringLiteral _ {
      return ['format', value];
    }

// ---------------------------------------------------------------------------
// File block
// ---------------------------------------------------------------------------

FileBlock
  = "File" _ name:StringLiteral _ "{" _ commands:FileCommand* "}" _ {
      return { type: 'File', name, commands };
    }

// ---------------------------------------------------------------------------
// File-level commands
// ---------------------------------------------------------------------------

FileCommand
  = TypeCommand
  / PasteCommand
  / EnterCommand
  / TabCommand
  / BackspaceCommand
  / ScrollCommand
  / MoveToCommand
  / HighlightCommand
  / SelectCommand
  / SleepCommand
  / AnnotateCommand

TypeCommand
  = "Type" _ text:StringLiteral _ {
      return { type: 'Type', text };
    }

PasteCommand
  = "Paste" _ text:StringLiteral _ {
      return { type: 'Paste', text };
    }

EnterCommand
  = "Enter" _ {
      return { type: 'Enter' };
    }

TabCommand
  = "Tab" _ {
      return { type: 'Tab' };
    }

BackspaceCommand
  = "Backspace" _ count:Integer _ {
      return { type: 'Backspace', count };
    }

ScrollCommand
  = "Scroll" _ line:Integer _ {
      return { type: 'Scroll', line };
    }

MoveToCommand
  = "MoveTo" _ line:Integer _ {
      return { type: 'MoveTo', line };
    }

HighlightCommand
  = "Highlight" _ range:RangeOrLine _ {
      return { type: 'Highlight', ...range };
    }

SelectCommand
  = "Select" _ range:Range _ {
      return { type: 'Select', ...range };
    }

// ---------------------------------------------------------------------------
// Shared commands (valid at top-level and inside File blocks)
// ---------------------------------------------------------------------------

SleepCommand
  = "Sleep" _ duration:Duration _ {
      return { type: 'Sleep', ...duration };
    }

AnnotateCommand
  = "Annotate" _ text:StringLiteral _ {
      return { type: 'Annotate', text };
    }

SplitCommand
  = "Split" _ direction:SplitDirection _ {
      return { type: 'Split', direction };
    }

SplitDirection
  = "Right" / "Down"

UnsplitCommand
  = "Unsplit" _ {
      return { type: 'Unsplit' };
    }

FocusCommand
  = "Focus" _ name:StringLiteral _ {
      return { type: 'Focus', name };
    }

// ---------------------------------------------------------------------------
// Range / Position
// ---------------------------------------------------------------------------

RangeOrLine
  = from:Position "-" to:Position {
      return { from, to };
    }
  / line:Integer {
      return { line };
    }

Range
  = from:Position "-" to:Position {
      return { from, to };
    }

Position
  = line:Integer ":" col:Integer {
      return { line, col };
    }

// ---------------------------------------------------------------------------
// Duration
// ---------------------------------------------------------------------------

Duration
  = value:Number unit:TimeUnit {
      return { value, unit };
    }

TimeUnit
  = "ms" / "s"

// ---------------------------------------------------------------------------
// JSON parser (for Editor block values)
// ---------------------------------------------------------------------------

JsonValue
  = JsonObject
  / JsonArray
  / JsonString
  / "true"  { return true; }
  / "false" { return false; }
  / "null"  { return null; }
  / JsonNumber

JsonObject
  = "{" _ pairs:JsonPair* "}" {
      return Object.fromEntries(pairs);
    }

JsonPair
  = key:JsonString _ ":" _ value:JsonValue _ ","? _ {
      return [key, value];
    }

JsonArray
  = "[" _ items:JsonArrayItem* "]" {
      return items;
    }

JsonArrayItem
  = value:JsonValue _ ","? _ {
      return value;
    }

JsonNumber
  = $("-"? [0-9]+ ("." [0-9]+)? (("e" / "E") ("+" / "-")? [0-9]+)?) {
      return parseFloat(text());
    }

JsonString
  = '"' chars:JsonChar* '"' {
      return chars.join('');
    }

JsonChar
  = "\\" sequence:JsonEscapeSequence { return sequence; }
  / [^"\\] { return text(); }

JsonEscapeSequence
  = '"'  { return '"';  }
  / "\\" { return "\\"; }
  / "/"  { return "/";  }
  / "n"  { return "\n"; }
  / "r"  { return "\r"; }
  / "t"  { return "\t"; }
  / "b"  { return "\b"; }
  / "f"  { return "\f"; }
  / "u" digits:$([0-9a-fA-F]|4|) {
      return String.fromCharCode(parseInt(digits, 16));
    }

// ---------------------------------------------------------------------------
// DSL string literals (double-quoted)
// ---------------------------------------------------------------------------

StringLiteral
  = '"' chars:StringChar* '"' {
      return chars.join('');
    }

StringChar
  = "\\" sequence:StringEscapeSequence { return sequence; }
  / [^"\\] { return text(); }

StringEscapeSequence
  = '"'  { return '"';  }
  / "\\" { return "\\"; }
  / "n"  { return "\n"; }
  / "t"  { return "\t"; }

// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

Integer
  = $[0-9]+ {
      return parseInt(text(), 10);
    }

Number
  = $([0-9]+ "." [0-9]* / "." [0-9]+ / [0-9]+) {
      return parseFloat(text());
    }

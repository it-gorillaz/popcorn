import ora from 'ora';

// Popcorn kernel shaking and popping frame sequences
const SHAKING_BAG = {
  frames: [
    '🍿 ',
    ' 🍿',
    '🍿 ',
    '🍿  ',
    ' 🍿 ',
    '  🍿',
    ' 🍿 ',
    '🍿  ',
  ],
  interval: 120,
};

const POPPING = {
  frames: [
    '🌽      ',
    '🌽 ·    ',
    '🌽 · ·  ',
    '💥      ',
    '🍿      ',
    '🍿 ·    ',
    '🍿 · ·  ',
    '🍿🍿    ',
    '🍿🍿 ·  ',
    '🍿🍿🍿  ',
  ],
  interval: 150,
};

const FILM = {
  frames: ['🎬', '🎥', '🎞️ ', '🎬'],
  interval: 300,
};

export function parsingSpinner(file) {
  return ora({
    text: `Parsing ${file}`,
    spinner: FILM,
    color: 'cyan',
  });
}

export function browserSpinner() {
  return ora({
    text: 'Warming up the projector...',
    spinner: SHAKING_BAG,
    color: 'yellow',
  });
}

export function recordingSpinner() {
  return ora({
    text: 'Preparing your popcorn...',
    spinner: POPPING,
    color: 'magenta',
  });
}

export function encodingSpinner(outputFile) {
  return ora({
    text: `Encoding ${outputFile}`,
    spinner: FILM,
    color: 'green',
  });
}

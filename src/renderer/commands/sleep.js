import { sleep } from '../annimations/typing.js';

function toMs({ value, unit }) {
  return unit === 'ms' ? value : Math.round(value * 1000);
}

export default async function execute(cmd) {
  await sleep(toMs(cmd));
}

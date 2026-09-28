// Everything in a row is sized from --rh (the row height): fewer players or a bigger screen
// means bigger rows and text, and up to 6 players always fit without scrolling.

const PORTRAIT = '(max-width: 860px)';
const PORTRAIT_LINES = 2.1;   // portrait rows hold two lines: name + track, then the controls
const MIN_ROW = 70;
const MAX_ROW = 190;

export function fitRows(board, playerCount) {
  const n = Math.max(playerCount, 1);
  const style = getComputedStyle(board);
  const gap = parseFloat(style.rowGap) || 8;
  const available = board.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom) - gap * (n - 1);
  const lines = matchMedia(PORTRAIT).matches ? PORTRAIT_LINES : 1;
  const rowHeight = Math.max(MIN_ROW, Math.min(MAX_ROW, available / n / lines));
  document.documentElement.style.setProperty('--rh', `${rowHeight}px`);
}

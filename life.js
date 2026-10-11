import { step, seed } from './life-core.mjs';
const canvas = document.getElementById('life');
const ctx = canvas.getContext('2d');
const pauseButton = document.getElementById('pause');
const hint = document.getElementById('garden-hint');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const coarsePointer = matchMedia('(pointer: coarse)');
const density = document.getElementById('density');
const densityValue = document.getElementById('density-value');
let paused = reducedMotion.matches;
let cols, rows, cells, next, trails;
let frame = 0, lastStep = 0, lastPaint = 0, lastX = -1, lastY = -1;
const size = 13;
const patterns = [ [[1,0],[2,1],[0,2],[1,2],[2,2]], [[0,1],[1,0],[1,1],[1,2],[2,0]], [[0,0],[1,0],[2,0],[2,1],[1,2]] ];
function updateControls() {
  pauseButton.textContent = paused ? 'Resume' : 'Pause';
  pauseButton.setAttribute('aria-pressed', String(paused));
  hint.textContent = paused ? 'garden paused' : coarsePointer.matches ? 'tap the background to grow' : 'move your cursor to grow';
}
function resize() {
  const width = innerWidth, height = innerHeight, ratio = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  const old = cells, oldCols = cols, oldRows = rows;
  cols = Math.ceil(width / size); rows = Math.ceil(height / size);
  cells = new Uint8Array(cols * rows); next = new Uint8Array(cells.length); trails = new Float32Array(cells.length);
  if (old) for(let y=0;y<Math.min(rows,oldRows);y++) for(let x=0;x<Math.min(cols,oldCols);x++) cells[y*cols+x]=old[y*oldCols+x];
  render();
}
function render() {
  ctx.clearRect(0, 0, innerWidth, innerHeight);
  for (let i = 0; i < cells.length; i++) {
    if (cells[i]) trails[i] = 1;
    if (trails[i] < .025) continue;
    ctx.fillStyle = cells[i] ? 'rgba(86,117,57,.32)' : `rgba(121,143,89,${trails[i] * .17})`;
    ctx.fillRect((i % cols) * size + 1, Math.floor(i / cols) * size + 1, size - 2, size - 2);
  }
}
function tick(now) {
  frame = 0;
  if (paused || document.hidden) return;
  if (now - lastStep >= 150) {
    step(cells, cols, rows, next); [cells, next] = [next, cells];
    for(let i=0;i<trails.length;i++) trails[i] *= .72;
    lastStep = now; render();
  }
  frame = requestAnimationFrame(tick);
}
function start() {
  if (!frame && !paused && !document.hidden) { lastStep = performance.now(); frame = requestAnimationFrame(tick); }
}
function plant(event) {
  if (paused || event.target.closest('a, button, summary, input, label, .garden')) return;
  if (event.type === 'pointermove' && event.pointerType !== 'mouse') return;
  const now = performance.now();
  const x = Math.floor(event.clientX / size), y = Math.floor(event.clientY / size);
  if (event.type === 'pointermove' && (now - lastPaint < 45 || (x === lastX && y === lastY))) return;
  lastPaint = now; lastX = x; lastY = y;
  const pattern = patterns[(x + y) % patterns.length];
  for (const [dx,dy] of pattern) {
    const nx=x+dx-1,ny=y+dy-1;
    if(nx>=0&&nx<cols&&ny>=0&&ny<rows) cells[ny*cols+nx]=1;
  }
  render(); start();
}
pauseButton.addEventListener('click', () => {
  paused = !paused; updateControls();
  if (paused) { cancelAnimationFrame(frame); frame = 0; } else start();
});
document.getElementById('clear').addEventListener('click', () => { cells.fill(0); next.fill(0); trails.fill(0); lastX = -1; lastY = -1; render(); });
document.addEventListener('pointermove', plant, { passive:true });
document.addEventListener('pointerdown', plant, { passive:true });
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else start(); });
reducedMotion.addEventListener('change', () => { paused = reducedMotion.matches; updateControls(); cancelAnimationFrame(frame); frame=0; start(); });
function regenerate() {
  seed(cells, cols, rows, Number(density.value));
  trails.fill(0); next.fill(0); lastX = -1; lastY = -1;
  render(); start();
}
document.getElementById('regenerate').addEventListener('click', regenerate);
density.addEventListener('input', () => { densityValue.value = density.value; regenerate(); });
window.addEventListener('resize', resize);
resize(); regenerate(); updateControls(); start();

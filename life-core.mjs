// Conway's B3/S23 rules, with a finite, non-wrapping boundary.
export function step(cells, cols, rows, next = new Uint8Array(cells.length)) {
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      let neighbors = 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if ((dx || dy) && nx >= 0 && nx < cols && ny >= 0 && ny < rows) neighbors += cells[ny * cols + nx];
      }
      const i = y * cols + x;
      next[i] = Number(neighbors === 3 || (cells[i] && neighbors === 2));
    }
  }
  return next;
}

// Small starting colonies: gliders, oscillators, and still lifes.
export const colonies = [
  [[1,0],[2,1],[0,2],[1,2],[2,2]],
  [[0,1],[1,1],[2,1]],
  [[1,0],[2,0],[3,0],[0,1],[1,1],[2,1]],
  [[0,0],[1,0],[0,1],[1,1],[2,2],[3,2],[2,3],[3,3]],
  [[0,0],[1,0],[0,1],[1,1]],
  [[1,0],[2,0],[0,1],[3,1],[1,2],[2,2]]
];
export function seed(cells, cols, rows, density, random = Math.random) {
  cells.fill(0);
  const count = Math.max(1, Math.round(cols * rows * density / 1100));
  for (let n = 0; n < count; n++) {
    const pattern = colonies[n % colonies.length];
    const x = Math.floor(random() * Math.max(1, cols - 4));
    const y = Math.floor(random() * Math.max(1, rows - 4));
    for (const [dx, dy] of pattern) if (x + dx < cols && y + dy < rows) cells[(y + dy) * cols + x + dx] = 1;
  }
  return cells;
}

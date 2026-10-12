// Responsive, buildless portfolio.
const tabs = [...document.querySelectorAll('[data-panel]')];
document.documentElement.classList.add('js');
document.querySelector('.tabs').setAttribute('role', 'tablist');
function selectTab(tab, focus = false) {
  for (const button of tabs) {
    const selected = button === tab;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-controls', button.dataset.panel);
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    const panel = document.getElementById(button.dataset.panel);
    panel.setAttribute('role', 'tabpanel');
    panel.tabIndex = 0;
    panel.hidden = !selected;
  }
  paginate(document.getElementById(tab.dataset.panel));
  if (focus) tab.focus();
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => selectTab(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (i + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (i + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(tabs[next], true); }
  });
});
// Fit complete items to each panel. Smaller viewports receive page arrows.
function paginate(panel) {
  const body = panel.querySelector('.panel-body');
  const pager = panel.querySelector('.pager');
  const items = [...body.querySelectorAll('.highlights > li, .recognition > p, article.entry')];
  items.forEach(item => { item.hidden = false; });
  pager.hidden = true;
  const sizes = items.map(item => {
    const style = getComputedStyle(item);
    return item.getBoundingClientRect().height + parseFloat(style.marginTop) + parseFloat(style.marginBottom);
  });
  const overhead = panel.id === 'highlights' ? 22 : 2;
  if (sizes.reduce((a, b) => a + b, 0) + overhead <= body.clientHeight) {
    panel.removeAttribute('data-paged');
    return;
  }
  pager.hidden = false;
  const budget = body.clientHeight - overhead;
  const pages = [[]];
  let used = 0;
  items.forEach((item, i) => {
    if (used + sizes[i] > budget && pages[pages.length - 1].length) { pages.push([]); used = 0; }
    pages[pages.length - 1].push(item); used += sizes[i];
  });
  let current = 0;
  panel.dataset.paged = 'true';
  const prev = pager.querySelector('.page-prev'), next = pager.querySelector('.page-next');
  function show() {
    items.forEach(item => { item.hidden = !pages[current].includes(item); });
    pager.querySelector('.page-count').textContent = `${current + 1} / ${pages.length}`;
    prev.disabled = current === 0; next.disabled = current === pages.length - 1;
  }
  prev.onclick = () => { if (current > 0) { current--; show(); } };
  next.onclick = () => { if (current < pages.length - 1) { current++; show(); } };
  show();
}
selectTab(tabs[0]);
addEventListener('resize', () => paginate(document.querySelector('.panel:not([hidden])')));
document.fonts.ready.then(() => paginate(document.querySelector('.panel:not([hidden])')));


// Layered interference ribbons with a soft cursor lens and fading wakes.
// Artistic rather than a physical ultrasound simulation.
const canvas = document.getElementById('field');
const ctx = canvas.getContext('2d', { alpha: false });
const motion = document.getElementById('motion');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches, frame = 0, lastTime = 0, phase = 0;
let width = 0, height = 0, pointerX = .72, pointerY = .46, targetX = .72, targetY = .46;
let wake = 0;
const ripples = [];
function resize() {
  width = innerWidth; height = innerHeight;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  render(); schedule();
}
function glow(x, y, radius, color, opacity) {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, `rgba(${color},${opacity})`);
  gradient.addColorStop(.45, `rgba(${color},${opacity * .35})`);
  gradient.addColorStop(1, `rgba(${color},0)`);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
}
function flowPoint(u, band, layer) {
  let x = u * width;
  let y = band * height + Math.sin(u * 5 + band * 2.8 + phase * .7 + layer) * height * .10
    + Math.sin(u * 10.5 - band * 3.4 - phase * .4) * height * .037;
  y -= (u - .5) * height * (layer ? -.2 : .25);
  // Smooth lenses bend the whole ribbon, creating broad folded structures.
  for (const lens of lenses) {
    const dx = x - lens.x, dy = y - lens.y;
    const angle = lens.turn * Math.exp(-(dx * dx + dy * dy) / lens.radius2);
    const c = Math.cos(angle), sn = Math.sin(angle);
    x = lens.x + dx * c - dy * sn;
    y = lens.y + dx * sn + dy * c;
  }
  const dx = x - pointerX * width, dy = y - pointerY * height;
  const radius = Math.min(240, width * .55);
  const influence = Math.exp(-(dx * dx + dy * dy) / (radius * radius));
  const bend = (18 + wake * 32) * influence;
  x += Math.sin(dy * .009 + phase) * bend;
  y += Math.sin(dx * .013 - phase * 1.3) * bend;
  for (const ripple of ripples) {
    const distance = Math.hypot(x - ripple.x, y - ripple.y);
    const front = ripple.age * 190;
    const pulse = Math.exp(-(((distance - front) / 45) ** 2)) * Math.exp(-ripple.age * .55);
    y += Math.sin(distance * .055 - ripple.age * 8) * 48 * pulse;
  }
  return [x, y];
}
let lenses = [];
function render() {
  ctx.fillStyle = '#090c0f'; ctx.fillRect(0, 0, width, height);
  lenses = [
    { x: width * (.2 + Math.sin(phase * .35) * .055), y: height * .42, radius2: (height * .5) ** 2, turn: 1.05 + Math.sin(phase * .4) * .22 },
    { x: width * .85, y: height * (.68 + Math.cos(phase * .28) * .09), radius2: (height * .43) ** 2, turn: -.85 },
  ];
  glow(width * .15, height * (.43 + Math.sin(phase * .3) * .12), height * .75, '149,167,181', .115);
  glow(width * .88, height * .65, height * .65, '174,175,163', .085);
  glow(pointerX * width, pointerY * height, 240, '178,192,201', .025 + wake * .035);
  for (let layer = 0; layer < 2; layer++) {
    const step = Math.max(11, height / 90) * (layer ? 2 : 1);
    let row = 0;
    for (let base = -height * .35; base <= height * 1.4; base += step, row++) {
      const band = base / height;
      const ridge = (.5 + .5 * Math.sin(band * 15 - phase * .55)) ** 3;
      const alpha = layer ? .025 + ridge * .055 : .045 + ridge * .135;
      ctx.strokeStyle = `rgba(190,204,212,${alpha})`;
      ctx.lineWidth = layer ? .55 : .75;
      ctx.beginPath();
      for (let i = 0; i <= 140; i++) {
        const [x, y] = flowPoint(-.25 + i / 140 * 1.5, band, layer);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      // Short luminous threads travel within selected ribbons, never flashing.
      if (!layer && row % 7 === 0) {
        const u = ((row * .137 + phase * .065) % 1.5) - .25;
        const [x, y] = flowPoint(u, band, layer);
        const [x2, y2] = flowPoint(u + .009, band, layer);
        ctx.strokeStyle = 'rgba(203,219,226,.28)'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      }
    }
  }
  for (const ripple of ripples) {
    for (let ring = 0; ring < 3; ring++) {
      const radius = ripple.age * 190 - ring * 24;
      if (radius <= 0) continue;
      ctx.strokeStyle = `rgba(211,226,237,${.32 * Math.exp(-ripple.age * .7) * (1 - ring * .18)})`;
      ctx.lineWidth = 1.2 - ring * .2;
      ctx.beginPath(); ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2); ctx.stroke();
    }
  }
  const vignette = ctx.createRadialGradient(width * .5, height * .5, height * .2, width * .5, height * .5, Math.max(width, height) * .75);
  vignette.addColorStop(0, '#0000'); vignette.addColorStop(1, '#0007');
  ctx.fillStyle = vignette; ctx.fillRect(0, 0, width, height);
}
function tick(time) {
  frame = 0;
  if (paused || document.hidden) return;
  if (!lastTime) lastTime = time;
  if (time - lastTime >= 32) {
    const elapsed = Math.min(time - lastTime, 80);
    phase += elapsed * .00016;
    wake *= .965;
    for (const ripple of ripples) ripple.age += elapsed / 1000;
    while (ripples.length && ripples[0].age > 4.5) ripples.shift();
    pointerX += (targetX - pointerX) * .12;
    pointerY += (targetY - pointerY) * .12;
    lastTime = time; render();
  }
  schedule();
}
function schedule() { if (!frame && !paused && !document.hidden) frame = requestAnimationFrame(tick); }
function updateMotion() {
  motion.innerHTML = paused ? 'Play <span aria-hidden="true">▷</span>' : 'Pause <span aria-hidden="true">Ⅱ</span>';
  motion.setAttribute('aria-pressed', String(paused));
  motion.setAttribute('aria-label', `${paused ? 'Play' : 'Pause'} background animation`);
  cancelAnimationFrame(frame); frame = 0; lastTime = 0; schedule();
}
motion.addEventListener('click', () => { paused = !paused; updateMotion(); });
reduced.addEventListener('change', event => { paused = event.matches; updateMotion(); });
document.addEventListener('visibilitychange', () => { cancelAnimationFrame(frame); frame = 0; lastTime = 0; schedule(); });
addEventListener('resize', resize);
addEventListener('pointermove', event => {
  wake = Math.min(1, wake + Math.hypot(event.clientX / width - targetX, event.clientY / height - targetY) * 7);
  targetX = event.clientX / width; targetY = event.clientY / height;
}, { passive: true });
addEventListener('pointerdown', event => {
  if (paused || event.target.closest('.card, .field-controls, .skip')) return;
  if (ripples.length >= 3) ripples.shift();
  ripples.push({ x: event.clientX, y: event.clientY, age: 0 });
}, { passive: true });
resize(); updateMotion();

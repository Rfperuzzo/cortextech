import Lenis from 'lenis';
import { createDrag } from './drag.js';

const between = (value, start, end) => Math.max(0, Math.min(1, (value - start) / Math.max(1, end - start)));
const lerp = (start, end, amount) => start + (end - start) * amount;
const smooth = t => t * t * (3 - 2 * t);

function revealSections() {
  if (!('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('has-reveal');
  const observer = new IntersectionObserver(entries => {
    for (const { isIntersecting, target } of entries) {
      if (!isIntersecting) continue;
      target.classList.add('revealed');
      observer.unobserve(target);
    }
  }, { threshold: .08 });
  document.querySelectorAll('[data-reveal]').forEach(element => observer.observe(element));
}

export function setupMotion() {
  revealSections();
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(pointer: fine)');
  const story = document.querySelector('.story');
  const canvas = document.querySelector('.brain-canvas');
  const anchors = [...document.querySelectorAll('[data-brain-anchor]')];
  const pillars = [...document.querySelectorAll('[data-pillar]')];
  const source = document.querySelector('[data-brain-source]');
  const target = document.querySelector('[data-screen-target]');
  const screen = document.querySelector('.screen__figure');
  const spark = document.querySelector('.travel-spark');
  const process = document.querySelector('.process-list');
  const controls = document.querySelector('.brain-controls');
  const drag = createDrag(document.querySelector('.brain-target'), controls);
  let scene, scenePending, lenis, frame, previousTime = 0;
  let sceneDisabled = false;
  let activePillar = -1;
  let previousLayout;
  let storyVisible = true;

  function updatePillar(index) {
    if (activePillar === index) return;
    activePillar = index;
    pillars.forEach((pillar, position) => pillar.classList.toggle('is-active', position === index));
  }

  function updateSpark(start, end, progress, deltaX) {
    const t = smooth(progress);
    const feather = Math.min(between(progress, 0, .12), 1 - between(progress, .9, 1));
    spark.style.opacity = feather;
    const x = lerp(start.x, end.x, t) + Math.sin(Math.PI * t) * deltaX;
    const y = lerp(start.y, end.y, t);
    spark.style.transform = 'translate3d(' + (x - 4) + 'px,' + (y - 4) + 'px,0)';
  }

  function draw(now) {
    frame = undefined;
    if (preference.matches || document.hidden) return;
    const dt = Math.min(.05, (now - (previousTime || now)) / 1000);
    previousTime = now;
    lenis?.raf(now);

    const w = document.documentElement.clientWidth;
    const h = window.innerHeight;
    const y = window.scrollY;
    const layout = [w, h, y].join(':');
    if (layout === previousLayout && !storyVisible) {
      wake();
      return;
    }
    previousLayout = layout;
    const narrow = w <= 760;
    const top = story.getBoundingClientRect();
    const finish = target.getBoundingClientRect();
    storyVisible = top.bottom > -60;
    const processRect = process.getBoundingClientRect();
    screen.style.setProperty('--screen-fill', smooth(between(h * .7 - finish.top, 0, h * .42)));
    process.style.setProperty('--process-fill', smooth(between(h * .73 - processRect.top, 0, processRect.height * .86)));

    const canDraw = scene && storyVisible;
    if (canDraw) {
      const [first, second] = anchors.map(anchor => anchor.getBoundingClientRect());
      const travel = between(y, first.bottom + y - h * .55, second.top + y - h * .41);
      const t = smooth(travel);
      const x = lerp(first.left + first.width / 2, second.left + second.width / 2, t);
      let cy = lerp(first.top + first.height / 2, second.top + second.height / 2, t);
      if (!narrow) cy = lerp(cy, Math.max(cy, h * .62), Math.sin(Math.PI * t) ** 2);
      const scale = lerp(first.width, second.width * .9, t);
      const exit = smooth(between(h * .91 - finish.top, 0, h * .42));
      let pillar = travel > .55 ? 0 : -1;
      if (pillar >= 0) {
        pillars.forEach((element, index) => {
          if (element.getBoundingClientRect().top < h * .64) pillar = index;
        });
      }
      updatePillar(pillar);
      drag.update(dt, travel < .16);
      const crossingFade = narrow ? 1 - .94 * Math.sin(Math.PI * t) : 1 - .72 * Math.sin(Math.PI * t);
      scene.draw({
        w, h, x: x + exit * Math.min(w * .09, 94), y: cy - exit * h * .25,
        scale: scale * (1 - exit * .15), yaw: drag.yaw + t * -.36, pitch: drag.pitch, time: now / 1000,
        opacity: crossingFade * (1 - exit), pillar
      });
    } else if (scene) {
      canvas.style.visibility = 'hidden';
    }
    const handoff = between(h * .95 - finish.top, 0, h * .47);
    if (handoff > 0 && handoff < 1) {
      const loose = source.getBoundingClientRect();
      const start = canDraw ? scene.projectSpark() : { x: loose.left, y: loose.top };
      if (!start || start.y < -80) {
        const slot = anchors[1].getBoundingClientRect();
        updateSpark({ x: slot.left + slot.width * .62, y: Math.max(-25, slot.bottom - slot.height * .35) },
          { x: finish.left + 3, y: finish.top + 3 }, handoff, Math.min(w * .18, 210));
      } else {
        updateSpark(start, { x: finish.left + 3, y: finish.top + 3 }, handoff, Math.min(w * .18, 210));
      }
    } else {
      spark.style.opacity = 0;
    }
    wake();
  }

  function wake() {
    if (frame === undefined && !preference.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }

  function sync() {
    previousLayout = undefined;
    lenis?.destroy();
    lenis = undefined;
    if (!preference.matches && fine.matches) {
      lenis = new Lenis({ autoRaf: false, lerp: .13, syncTouch: false });
    }
    if (preference.matches) {
      cancelAnimationFrame(frame);
      frame = undefined;
      previousTime = 0;
      spark.style.opacity = 0;
      document.documentElement.classList.remove('has-brain');
      controls.hidden = true;
      updatePillar(-1);
      return;
    }
    if (scene && !sceneDisabled) {
      document.documentElement.classList.add('has-brain');
      controls.hidden = false;
    } else if (!scenePending && !sceneDisabled) {
      scenePending = import('./scene.js').then(module => module.createBrain(canvas)).then(result => {
        scene = result;
        canvas.dataset.ready = 'true';
        sync();
      }).catch(() => {
        sceneDisabled = true;
        canvas.dataset.ready = 'fallback';
      });
    }
    wake();
  }

  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault();
    scene = undefined;
    sceneDisabled = true;
    canvas.dataset.ready = 'fallback';
    controls.hidden = true;
    document.documentElement.classList.remove('has-brain');
  });
  preference.addEventListener('change', sync);
  fine.addEventListener('change', sync);
  document.addEventListener('visibilitychange', wake);
  sync();
}

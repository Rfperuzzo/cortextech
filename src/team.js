export function setupTeam() {
  const section = document.querySelector('#equipe');
  const track = section.querySelector('.team__track');
  const controls = section.querySelector('.team__controls');
  const previous = controls.querySelector('[data-team-step="-1"]');
  const next = controls.querySelector('[data-team-step="1"]');
  const auto = controls.querySelector('[data-team-toggle]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const progress = section.querySelector('.team__progress i');
  let inView = false;
  let overTrack = false;
  let running = true;
  let direction = 1;

  const maxScroll = () => Math.max(0, track.scrollWidth - track.clientWidth);
  function sync() {
    const max = maxScroll();
    const offset = Math.max(0, track.scrollLeft);
    previous.setAttribute('aria-disabled', String(offset < 2));
    next.setAttribute('aria-disabled', String(offset >= max - 2));
    controls.hidden = max < 2;
    auto.hidden = reduced.matches || !('IntersectionObserver' in window);
    auto.setAttribute('aria-pressed', String(running));
    progress.style.setProperty('--team-progress', max ? Math.min(1, offset / max) : 1);
  }

  function move(step) {
    const [first, second] = track.children;
    if (!second) return;
    const distance = second.offsetLeft - first.offsetLeft;
    if (distance < 1) return;
    const offset = track.scrollLeft;
    const index = step < 0 ? Math.ceil((offset - 2) / distance) - 1 : Math.floor((offset + 2) / distance) + 1;
    track.scrollTo({
      left: Math.max(0, Math.min(maxScroll(), index * distance)),
      behavior: reduced.matches ? 'instant' : 'smooth'
    });
  }

  [previous, next].forEach(button => button.addEventListener('click', () => {
    if (button.getAttribute('aria-disabled') === 'true') return;
    direction = Number(button.dataset.teamStep);
    move(direction);
  }));
  auto.addEventListener('click', () => {
    running = !running;
    sync();
  });
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    direction = event.key === 'ArrowRight' ? 1 : -1;
    move(direction);
  });
  track.addEventListener('pointerenter', event => { overTrack = event.pointerType === 'mouse'; });
  track.addEventListener('pointerleave', () => { overTrack = false; });
  track.addEventListener('scroll', sync, { passive: true });
  window.addEventListener('resize', sync);
  reduced.addEventListener('change', sync);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => { inView = entry.intersectionRatio >= .5; }, { threshold: .5 }).observe(track);
    setInterval(() => {
      if (!inView || !running || reduced.matches || document.hidden || overTrack ||
          track.contains(document.activeElement) || controls.contains(document.activeElement) || maxScroll() < 2) return;
      if (track.scrollLeft >= maxScroll() - 2) direction = -1;
      if (track.scrollLeft < 2) direction = 1;
      move(direction);
    }, 5600);
  }
  sync();
}

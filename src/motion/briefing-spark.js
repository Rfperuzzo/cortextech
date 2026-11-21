export function createBriefingSpark(body, button) {
  const spark = body.querySelector('.briefing__spark');
  const indicator = body.querySelector('.briefing__rail i');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let flight;

  return function signal(stage, last) {
    flight?.cancel();
    if (reduced.matches || stage !== last || !spark.animate) return;
    const area = body.getBoundingClientRect();
    const from = indicator.getBoundingClientRect();
    const to = button.getBoundingClientRect();
    const x = from.left + from.width / 2 - area.left;
    const y = from.top + from.height / 2 - area.top;
    const targetX = to.left + to.width / 2 - area.left;
    const targetY = to.top + to.height / 2 - area.top;
    const gutter = Math.min(area.width - 6, Math.max(x, targetX) + 65);
    const move = (left, top) => 'translate(' + left + 'px,' + top + 'px)';
    flight = spark.animate([
      { opacity: 0, transform: move(x, y) },
      { opacity: 1, transform: move(gutter, y + 25), offset: .19 },
      { opacity: .75, transform: move(gutter, targetY - 18), offset: .81 },
      { opacity: 0, transform: move(targetX, targetY) }
    ], { duration: 770, easing: 'cubic-bezier(.25,.55,.35,1)' });
  };
}

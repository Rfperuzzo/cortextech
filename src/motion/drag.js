const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

export function createDrag(target, controls) {
  const state = { yaw: 0, pitch: 0, update };
  let pointer = null;
  let yawVelocity = 0;
  let pitchVelocity = 0;

  target.addEventListener('pointerdown', event => {
    if (event.button !== 0 || pointer || controls.hidden) return;
    target.setPointerCapture(event.pointerId);
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
    yawVelocity = pitchVelocity = 0;
    target.classList.add('dragging');
  });
  target.addEventListener('pointermove', event => {
    if (pointer?.id !== event.pointerId) return;
    const scale = Math.max(120, target.clientWidth * .42);
    const dx = (event.clientX - pointer.x) / scale;
    const dy = event.pointerType === 'touch' ? 0 : (event.clientY - pointer.y) / scale;
    const dt = Math.max(.012, (event.timeStamp - pointer.time) / 1000);
    state.yaw += dx;
    state.pitch = clamp(state.pitch + dy, -.6, .6);
    yawVelocity = clamp(dx / dt, -5, 5);
    pitchVelocity = clamp(dy / dt, -3, 3);
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp };
  });

  function release(event) {
    if (pointer?.id !== event.pointerId) return;
    if (event.type !== 'pointerup' || event.timeStamp - pointer.time > 85) yawVelocity = pitchVelocity = 0;
    pointer = null;
    target.classList.remove('dragging');
  }
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(type => target.addEventListener(type, release));
  controls.addEventListener('click', event => {
    const button = event.target.closest('[data-rotate]');
    if (button) yawVelocity = Number(button.dataset.rotate) * 2.1;
  });

  function update(dt, active) {
    if (pointer && active) return;
    if (!active) {
      yawVelocity = pitchVelocity = 0;
      state.yaw = Math.atan2(Math.sin(state.yaw), Math.cos(state.yaw)) * Math.exp(-dt * 4);
    }
    state.yaw += yawVelocity * dt;
    state.pitch = clamp((state.pitch + pitchVelocity * dt) * Math.exp(-dt * 1.9), -.6, .6);
    yawVelocity *= Math.exp(-dt * 3.8);
    pitchVelocity *= Math.exp(-dt * 4.6);
  }

  return state;
}

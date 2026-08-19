/** Spawn an iOS-style liquid ripple at click point inside a container */
export function spawnLiquidRipple(
  e: { clientX: number; clientY: number; currentTarget: EventTarget | null },
  container?: HTMLElement | null
) {
  const el = (container || (e.currentTarget as HTMLElement)) as HTMLElement;
  if (!el) return;
  const rect = el.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height) * 1.6;
  const x = e.clientX - rect.left - size / 2;
  const y = e.clientY - rect.top - size / 2;
  const ripple = document.createElement('span');
  ripple.className = 'liquid-ripple';
  ripple.style.width = `${size}px`;
  ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`;
  ripple.style.top = `${y}px`;
  const prev = getComputedStyle(el).position;
  if (prev === 'static') el.style.position = 'relative';
  el.appendChild(ripple);
  window.setTimeout(() => ripple.remove(), 750);
}

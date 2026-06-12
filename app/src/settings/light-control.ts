/**
 * Light Control Widget
 *
 * An interactive SVG-based control for directional scene lighting.
 *
 * The widget lets users control four light parameters:
 *   - azimuth   (0-360°)  — horizontal direction
 *   - elevation (0-90°)   — vertical height
 *   - intensity (0-5)     — light strength
 *   - softness  (0-1)     — shadow/terminator softness
 *
 * Layout:
 *   ┌──────────────────────┐
 *   │                      │
 *   │   ╭── Elevation ──╮ │
 *   │   │                │ │
 *   │   │    ☀️          │ │  ← Azimuth circle with light dot
 *   │   │                │ │
 *   │   ╰────────────────╯ │
 *   │  Softness ◄───────►  │
 *   │ Intensity ◄───────►  │
 *   └──────────────────────┘
 *
 * All interactions use Pointer Events for unified mouse/touch support.
 */

import type { LightValue } from './registry';

/* ── Constants ────────────────────────────────────── */

const WIDTH = 220;
const HEIGHT = 290;

const CX = WIDTH / 2;        // 110

const AZIMUTH_R = 70;        // azimuth ring radius
const ELEV_ARC_R = AZIMUTH_R + 18; // elevation arc radius (outside)
const SOFT_BAR_Y = AZIMUTH_R + 50; // softness bar Y offset from center
const INTENS_BAR_Y = AZIMUTH_R + 82; // intensity bar Y offset from center

const HANDLE_R = 8;          // handle dot radius
const TOUCH_TARGET = 44;     // minimum touch target

/* ── DOM Creation ─────────────────────────────────── */

/**
 * Creates the light control widget DOM element.
 *
 * Returns an HTMLElement containing an interactive SVG that handles
 * all pointer-based interaction for the four light parameters.
 */
export function createLightControl(
  value: LightValue,
  onChange: (value: LightValue) => void,
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'light-control';
  container.style.cssText = `
    position: relative;
    width: ${WIDTH}px;
    height: ${HEIGHT}px;
    margin: 0 auto;
    touch-action: none;
    user-select: none;
  `;

  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', `0 0 ${WIDTH} ${HEIGHT}`);
  svg.setAttribute('width', String(WIDTH));
  svg.setAttribute('height', String(HEIGHT));
  svg.style.display = 'block';

  /* ── Static visual elements ─────────────────────── */

  // Background circle (azimuth ring track)
  const azimTrack = document.createElementNS(ns, 'circle');
  azimTrack.setAttribute('cx', String(CX));
  azimTrack.setAttribute('cy', String(HEIGHT * 0.38));
  azimTrack.setAttribute('r', String(AZIMUTH_R));
  azimTrack.setAttribute('fill', 'none');
  azimTrack.setAttribute('stroke', 'var(--border)');
  azimTrack.setAttribute('stroke-width', '2');
  svg.append(azimTrack);

  // Azimuth active arc (filled portion from 0° to current azimuth)
  const azimArc = document.createElementNS(ns, 'path');
  azimArc.setAttribute('fill', 'none');
  azimArc.setAttribute('stroke', 'var(--accent)');
  azimArc.setAttribute('stroke-width', '3');
  azimArc.setAttribute('stroke-linecap', 'round');
  svg.append(azimArc);

  // Elevation arc track (left semi-circle)
  const elevTrack = document.createElementNS(ns, 'path');
  elevTrack.setAttribute('fill', 'none');
  elevTrack.setAttribute('stroke', 'var(--border)');
  elevTrack.setAttribute('stroke-width', '2');
  svg.append(elevTrack);

  // Elevation arc fill
  const elevArc = document.createElementNS(ns, 'path');
  elevArc.setAttribute('fill', 'none');
  elevArc.setAttribute('stroke', 'var(--accent)');
  elevArc.setAttribute('stroke-width', '3');
  elevArc.setAttribute('stroke-linecap', 'round');
  svg.append(elevArc);

  // Softness track (horizontal arc at bottom)
  const softTrack = document.createElementNS(ns, 'path');
  softTrack.setAttribute('fill', 'none');
  softTrack.setAttribute('stroke', 'var(--border)');
  softTrack.setAttribute('stroke-width', '2');
  svg.append(softTrack);

  // Softness fill
  const softFill = document.createElementNS(ns, 'path');
  softFill.setAttribute('fill', 'none');
  softFill.setAttribute('stroke', 'var(--accent)');
  softFill.setAttribute('stroke-width', '3');
  softFill.setAttribute('stroke-linecap', 'round');
  svg.append(softFill);

  // Softness label icons (hard ↔ soft)
  const hardLabel = document.createElementNS(ns, 'text');
  hardLabel.setAttribute('x', String(CX - AZIMUTH_R - 2));
  hardLabel.setAttribute('y', String(HEIGHT * 0.38 + SOFT_BAR_Y + 4));
  hardLabel.setAttribute('text-anchor', 'end');
  hardLabel.setAttribute('fill', 'var(--text-muted)');
  hardLabel.setAttribute('font-size', '10');
  hardLabel.setAttribute('font-family', 'var(--font-sans)');
  hardLabel.textContent = '◀';
  svg.append(hardLabel);

  const softLabel = document.createElementNS(ns, 'text');
  softLabel.setAttribute('x', String(CX + AZIMUTH_R + 2));
  softLabel.setAttribute('y', String(HEIGHT * 0.38 + SOFT_BAR_Y + 4));
  softLabel.setAttribute('text-anchor', 'start');
  softLabel.setAttribute('fill', 'var(--text-muted)');
  softLabel.setAttribute('font-size', '10');
  softLabel.setAttribute('font-family', 'var(--font-sans)');
  softLabel.textContent = '▶';
  svg.append(softLabel);

  // Intensity track
  const intTrack = document.createElementNS(ns, 'path');
  intTrack.setAttribute('fill', 'none');
  intTrack.setAttribute('stroke', 'var(--border)');
  intTrack.setAttribute('stroke-width', '2');
  svg.append(intTrack);

  // Intensity fill
  const intFill = document.createElementNS(ns, 'path');
  intFill.setAttribute('fill', 'none');
  intFill.setAttribute('stroke', 'var(--accent)');
  intFill.setAttribute('stroke-width', '3');
  intFill.setAttribute('stroke-linecap', 'round');
  svg.append(intFill);

  // Intensity label (low ↔ high)
  const lowLabel = document.createElementNS(ns, 'text');
  lowLabel.setAttribute('x', String(CX - AZIMUTH_R - 2));
  lowLabel.setAttribute('y', String(HEIGHT * 0.38 + INTENS_BAR_Y + 4));
  lowLabel.setAttribute('text-anchor', 'end');
  lowLabel.setAttribute('fill', 'var(--text-muted)');
  lowLabel.setAttribute('font-size', '10');
  lowLabel.setAttribute('font-family', 'var(--font-sans)');
  lowLabel.textContent = '◀';
  svg.append(lowLabel);

  const highLabel = document.createElementNS(ns, 'text');
  highLabel.setAttribute('x', String(CX + AZIMUTH_R + 2));
  highLabel.setAttribute('y', String(HEIGHT * 0.38 + INTENS_BAR_Y + 4));
  highLabel.setAttribute('text-anchor', 'start');
  highLabel.setAttribute('fill', 'var(--text-muted)');
  highLabel.setAttribute('font-size', '10');
  highLabel.setAttribute('font-family', 'var(--font-sans)');
  highLabel.textContent = '▶';
  svg.append(highLabel);

  // Section labels
  function addLabel(text: string, y: number): SVGTextElement {
    const label = document.createElementNS(ns, 'text');
    label.setAttribute('x', String(CX));
    label.setAttribute('y', String(y));
    label.setAttribute('text-anchor', 'middle');
    label.setAttribute('fill', 'var(--text-secondary)');
    label.setAttribute('font-size', '9');
    label.setAttribute('font-family', 'var(--font-sans)');
    label.setAttribute('opacity', '0.7');
    label.textContent = text;
    svg.append(label);
    return label;
  }

  addLabel('SOFTNESS', HEIGHT * 0.38 + SOFT_BAR_Y - 12);
  addLabel('INTENSITY', HEIGHT * 0.38 + INTENS_BAR_Y - 12);

  // Light position dot
  const lightDot = document.createElementNS(ns, 'circle');
  lightDot.setAttribute('r', '8');
  lightDot.setAttribute('fill', 'var(--accent)');
  lightDot.setAttribute('stroke', '#fff');
  lightDot.setAttribute('stroke-width', '2');
  svg.append(lightDot);

  // Light dot glow
  const glowDot = document.createElementNS(ns, 'circle');
  glowDot.setAttribute('r', '14');
  glowDot.setAttribute('fill', 'none');
  glowDot.setAttribute('stroke', 'var(--accent)');
  glowDot.setAttribute('stroke-width', '1');
  glowDot.setAttribute('opacity', '0.3');
  svg.append(glowDot);

  // Azimuth handle (on the ring)
  const azimHandle = document.createElementNS(ns, 'circle');
  azimHandle.setAttribute('r', String(HANDLE_R));
  azimHandle.setAttribute('fill', 'var(--accent)');
  azimHandle.setAttribute('stroke', '#fff');
  azimHandle.setAttribute('stroke-width', '2');
  azimHandle.setAttribute('cursor', 'grab');
  svg.append(azimHandle);

  // Elevation handle
  const elevHandle = document.createElementNS(ns, 'circle');
  elevHandle.setAttribute('r', String(HANDLE_R));
  elevHandle.setAttribute('fill', 'var(--accent-hover)');
  elevHandle.setAttribute('stroke', '#fff');
  elevHandle.setAttribute('stroke-width', '2');
  elevHandle.setAttribute('cursor', 'grab');
  svg.append(elevHandle);

  // Softness handle
  const softHandle = document.createElementNS(ns, 'circle');
  softHandle.setAttribute('r', String(HANDLE_R));
  softHandle.setAttribute('fill', 'var(--accent-hover)');
  softHandle.setAttribute('stroke', '#fff');
  softHandle.setAttribute('stroke-width', '2');
  softHandle.setAttribute('cursor', 'grab');
  svg.append(softHandle);

  // Intensity handle
  const intHandle = document.createElementNS(ns, 'circle');
  intHandle.setAttribute('r', String(HANDLE_R));
  intHandle.setAttribute('fill', 'var(--accent-hover)');
  intHandle.setAttribute('stroke', '#fff');
  intHandle.setAttribute('stroke-width', '2');
  intHandle.setAttribute('cursor', 'grab');
  svg.append(intHandle);

  /* ── Numeric Readout ────────────────────────────── */

  const readout = document.createElement('div');
  readout.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px 12px;
    padding: 6px 0 0;
    font-family: var(--font-mono);
    font-size: 10px;
    color: var(--text-secondary);
    text-align: center;
  `;

  function updateReadout(v: LightValue) {
    readout.innerHTML = `
      <span>Az: ${Math.round(v.azimuth)}°</span>
      <span>El: ${Math.round(v.elevation)}°</span>
      <span>Int: ${v.intensity.toFixed(1)}</span>
      <span>Sft: ${v.softness.toFixed(2)}</span>
    `;
  }

  container.append(svg, readout);

  /* ── Geometry Helpers ───────────────────────────── */

  const CYC = HEIGHT * 0.38; // center Y of azimuth circle

  /**
   * Converts azimuth degrees to a point on the ring.
   * 0° = top, clockwise.
   */
  function azimuthToPoint(azimuth: number, r: number): { x: number; y: number } {
    const rad = (azimuth - 90) * (Math.PI / 180); // -90 so 0° is at top
    return {
      x: CX + r * Math.cos(rad),
      y: CYC + r * Math.sin(rad),
    };
  }

  /**
   * Converts a point relative to center to an azimuth angle in degrees.
   */
  function pointToAzimuth(x: number, y: number): number {
    const dx = x - CX;
    const dy = y - CYC;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
    if (deg < 0) deg += 360;
    return deg % 360;
  }

  /**
   * Converts elevation degrees to a point on the elevation arc (left side).
   * 0° = bottom, 90° = top.
   */
  function elevationToPoint(elevation: number): { x: number; y: number } {
    // Arc goes from 180° (bottom) to 0° (top) on the circle
    // We offset the arc to the left side
    const rad = (elevation + 180) * (Math.PI / 180);
    return {
      x: CX + ELEV_ARC_R * Math.cos(rad),
      y: CYC + ELEV_ARC_R * Math.sin(rad),
    };
  }

  /**
   * Converts a point to an elevation angle.
   */
  function pointToElevation(x: number, y: number): number {
    const dx = x - CX;
    const dy = y - CYC;
    let deg = Math.atan2(dy, dx) * (180 / Math.PI);
    // Map to 0-90°: bottom of left semi-circle = 0°, top = 90°
    deg = 180 - deg; // flip so bottom is 0
    if (deg < 0) deg += 360;
    // Clamp to left side (90° to 270° in circle coords, which maps to 0-90° elevation)
    if (deg > 90 && deg < 270) {
      // Pick the closer edge
      if (deg < 180) deg = 90;
      else deg = 270;
    }
    // Map 90→270 range to 0→90
    if (deg >= 270) deg = 90 - (deg - 270);
    else if (deg <= 90) deg = 90 - deg;
    return Math.min(90, Math.max(0, deg));
  }

  /**
   * Converts softness to a point on the bottom horizontal bar.
   */
  function softnessToPoint(softness: number): { x: number; y: number } {
    const x = CX - AZIMUTH_R + softness * 2 * AZIMUTH_R;
    return { x, y: CYC + SOFT_BAR_Y };
  }

  function pointToSoftness(x: number): number {
    const clamped = Math.min(CX + AZIMUTH_R, Math.max(CX - AZIMUTH_R, x));
    return (clamped - (CX - AZIMUTH_R)) / (2 * AZIMUTH_R);
  }

  /**
   * Converts intensity to a point on the bottom horizontal bar.
   */
  function intensityToPoint(intensity: number): { x: number; y: number } {
    // Map 0-5 to 0-2*AZIMUTH_R
    const frac = Math.min(1, Math.max(0, intensity / 5));
    const x = CX - AZIMUTH_R + frac * 2 * AZIMUTH_R;
    return { x, y: CYC + INTENS_BAR_Y };
  }

  function pointToIntensity(x: number): number {
    const clamped = Math.min(CX + AZIMUTH_R, Math.max(CX - AZIMUTH_R, x));
    const frac = (clamped - (CX - AZIMUTH_R)) / (2 * AZIMUTH_R);
    return frac * 5;
  }

  /**
   * Build an SVG arc path string.
   */
  function arcPath(
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number,
  ): string {
    if (Math.abs(endDeg - startDeg) < 0.01) return '';
    const startRad = (startDeg - 90) * (Math.PI / 180);
    const endRad = (endDeg - 90) * (Math.PI / 180);
    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);
    const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  function barPath(
    x1: number,
    y: number,
    x2: number,
  ): string {
    return `M ${x1} ${y} L ${x2} ${y}`;
  }

  /* ── Update Function ────────────────────────────── */

  function update(v: LightValue) {
    // Azimuth arc (filled portion from 0°)
    azimArc.setAttribute('d',
      v.azimuth > 0
        ? arcPath(CX, CYC, AZIMUTH_R, 0, v.azimuth)
        : ''
    );

    // Azimuth handle
    const azPt = azimuthToPoint(v.azimuth, AZIMUTH_R);
    azimHandle.setAttribute('cx', String(azPt.x));
    azimHandle.setAttribute('cy', String(azPt.y));

    // Elevation arc track (left semi-circle, bottom to top: 0° to 180° in our coords = 0° to 90° elevation)
    const elevTrackD = arcPath(CX, CYC, ELEV_ARC_R, 0, 180);
    elevTrack.setAttribute('d', elevTrackD);

    // Elevation fill (from 0° elevation = bottom, to current elevation)
    if (v.elevation > 0) {
      elevArc.setAttribute('d', arcPath(CX, CYC, ELEV_ARC_R, 0, v.elevation));
    } else {
      elevArc.setAttribute('d', '');
    }

    // Elevation handle
    const elevPt = elevationToPoint(v.elevation);
    elevHandle.setAttribute('cx', String(elevPt.x));
    elevHandle.setAttribute('cy', String(elevPt.y));

    // Softness bar
    const softLeft = CX - AZIMUTH_R;
    const softRight = CX + AZIMUTH_R;
    const softY = CYC + SOFT_BAR_Y;
    softTrack.setAttribute('d', barPath(softLeft, softY, softRight));

    const softPt = softnessToPoint(v.softness);
    softFill.setAttribute('d', barPath(softLeft, softY, softPt.x));
    softHandle.setAttribute('cx', String(softPt.x));
    softHandle.setAttribute('cy', String(softPt.y));

    // Intensity bar
    const intY = CYC + INTENS_BAR_Y;
    intTrack.setAttribute('d', barPath(softLeft, intY, softRight));

    const intPt = intensityToPoint(v.intensity);
    intFill.setAttribute('d', barPath(softLeft, intY, intPt.x));
    intHandle.setAttribute('cx', String(intPt.x));
    intHandle.setAttribute('cy', String(intPt.y));

    // Light position dot (project azimuth/elevation onto 2D disk)
    // Angle = azimuth, dist from center = (1 - elevation/90) * AZIMUTH_R * 0.65
    const dotRad = (v.azimuth - 90) * (Math.PI / 180);
    const dotDist = (1 - v.elevation / 90) * AZIMUTH_R * 0.65;
    const dotX = CX + dotDist * Math.cos(dotRad);
    const dotY = CYC + dotDist * Math.sin(dotRad);
    lightDot.setAttribute('cx', String(dotX));
    lightDot.setAttribute('cy', String(dotY));
    glowDot.setAttribute('cx', String(dotX));
    glowDot.setAttribute('cy', String(dotY));

    // Readout
    updateReadout(v);
  }

  update(value);

  /* ── Pointer Interaction ────────────────────────── */

  let activeControl: 'azimuth' | 'elevation' | 'softness' | 'intensity' | null = null;

  function getControlFromPoint(clientX: number, clientY: number): 'azimuth' | 'elevation' | 'softness' | 'intensity' | null {
    const rect = svg.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    // Scale from client coords to SVG viewBox coords
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const svgX = x * scaleX;
    const svgY = y * scaleY;

    const dx = svgX - CX;
    const dy = svgY - CYC;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Check controls: priority by distance from center

    // Softness bar (bottom area)
    const softY = CYC + SOFT_BAR_Y;
    if (Math.abs(svgY - softY) < TOUCH_TARGET * scaleY * 0.4 &&
        Math.abs(svgX - CX) < AZIMUTH_R + TOUCH_TARGET * scaleX * 0.4) {
      return 'softness';
    }

    // Intensity bar (bottom area)
    const intY = CYC + INTENS_BAR_Y;
    if (Math.abs(svgY - intY) < TOUCH_TARGET * scaleY * 0.4 &&
        Math.abs(svgX - CX) < AZIMUTH_R + TOUCH_TARGET * scaleX * 0.4) {
      return 'intensity';
    }

    // Elevation arc (left side, radius ~ELEV_ARC_R)
    if (svgX < CX && Math.abs(dist - ELEV_ARC_R) < TOUCH_TARGET * scaleX * 0.5) {
      return 'elevation';
    }

    // Azimuth ring (near the main circle radius)
    if (Math.abs(dist - AZIMUTH_R) < TOUCH_TARGET * scaleX * 0.5) {
      return 'azimuth';
    }

    // Inside the circle: check if closer to center than AZIMUTH_R + margin
    // Default to azimuth for inside-taps
    if (dist < AZIMUTH_R + TOUCH_TARGET * scaleX * 0.3) {
      return 'azimuth';
    }

    return null;
  }

  function handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    svg.setPointerCapture(e.pointerId);

    const control = getControlFromPoint(e.clientX, e.clientY);
    if (control) {
      activeControl = control;
      const el = e.currentTarget as SVGElement;
      el.style.cursor = 'grabbing';
      processPointer(e, control);
    }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!activeControl) return;
    e.preventDefault();
    processPointer(e, activeControl);
  }

  function handlePointerUp(e: PointerEvent) {
    if (!activeControl) return;
    activeControl = null;
    const el = e.currentTarget as SVGElement;
    el.style.cursor = 'default';
    svg.releasePointerCapture(e.pointerId);
  }

  function processPointer(e: PointerEvent, control: string) {
    const rect = svg.getBoundingClientRect();
    const scaleX = WIDTH / rect.width;
    const scaleY = HEIGHT / rect.height;
    const svgX = (e.clientX - rect.left) * scaleX;
    const svgY = (e.clientY - rect.top) * scaleY;

    const v = { ...value };

    switch (control) {
      case 'azimuth': {
        v.azimuth = pointToAzimuth(svgX, svgY);
        break;
      }
      case 'elevation': {
        v.elevation = pointToElevation(svgX, svgY);
        break;
      }
      case 'softness': {
        v.softness = Math.min(1, Math.max(0, pointToSoftness(svgX)));
        break;
      }
      case 'intensity': {
        v.intensity = Math.min(5, Math.max(0, pointToIntensity(svgX)));
        break;
      }
    }

    value = v;
    update(v);
    onChange(v);
  }

  svg.addEventListener('pointerdown', handlePointerDown);
  svg.addEventListener('pointermove', handlePointerMove);
  svg.addEventListener('pointerup', handlePointerUp);
  svg.addEventListener('pointercancel', handlePointerUp);

  /* ── Cleanup ────────────────────────────────────── */

  (container as any)._dispose = () => {
    svg.removeEventListener('pointerdown', handlePointerDown);
    svg.removeEventListener('pointermove', handlePointerMove);
    svg.removeEventListener('pointerup', handlePointerUp);
    svg.removeEventListener('pointercancel', handlePointerUp);
  };

  return container;
}

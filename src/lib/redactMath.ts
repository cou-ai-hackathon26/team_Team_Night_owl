/**
 * Pure coordinate math for canvas image redaction (Spec 5.2.5)
 * Converts screen/pointer coordinates on a rendered canvas element
 * to true image coordinates, with clamping and scaling.
 */

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function screenToImageCoords(
  screenX: number,
  screenY: number,
  canvasDisplayWidth: number,
  canvasDisplayHeight: number,
  imageNaturalWidth: number,
  imageNaturalHeight: number
): { x: number; y: number } {
  if (canvasDisplayWidth <= 0 || canvasDisplayHeight <= 0) {
    return { x: 0, y: 0 };
  }

  const scaleX = imageNaturalWidth / canvasDisplayWidth;
  const scaleY = imageNaturalHeight / canvasDisplayHeight;

  const rawX = screenX * scaleX;
  const rawY = screenY * scaleY;

  // Clamping to image bounds
  const clampedX = Math.max(0, Math.min(imageNaturalWidth, rawX));
  const clampedY = Math.max(0, Math.min(imageNaturalHeight, rawY));

  return { x: clampedX, y: clampedY };
}

export function normalizeRect(x1: number, y1: number, x2: number, y2: number): Rect {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return { x, y, width, height };
}

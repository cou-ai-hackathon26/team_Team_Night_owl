export function screenToImageCoords(
  screenX,
  screenY,
  canvasDisplayWidth,
  canvasDisplayHeight,
  imageNaturalWidth,
  imageNaturalHeight
) {
  if (canvasDisplayWidth <= 0 || canvasDisplayHeight <= 0) {
    return { x: 0, y: 0 };
  }

  const scaleX = imageNaturalWidth / canvasDisplayWidth;
  const scaleY = imageNaturalHeight / canvasDisplayHeight;

  const rawX = screenX * scaleX;
  const rawY = screenY * scaleY;

  const clampedX = Math.max(0, Math.min(imageNaturalWidth, rawX));
  const clampedY = Math.max(0, Math.min(imageNaturalHeight, rawY));

  return { x: clampedX, y: clampedY };
}

export function normalizeRect(x1, y1, x2, y2) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const width = Math.abs(x2 - x1);
  const height = Math.abs(y2 - y1);
  return { x, y, width, height };
}

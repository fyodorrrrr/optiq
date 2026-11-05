import { maxImageSide, maxImagePixels } from '../../api/profile'

// Match the selected backend profile before submitting resize requests.
export const maxResizeSide = maxImageSide
export const maxResizePixels = maxImagePixels

export function resizeError(width: number, height: number): string | undefined {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) {
    return 'Use positive whole numbers for width and height.'
  }
  if (width > maxResizeSide || height > maxResizeSide) {
    return `Resize dimensions must be at most ${maxResizeSide} px per side.`
  }
  if (width * height > maxResizePixels) {
    return `${width} × ${height} produces ${(width * height).toLocaleString()} pixels. Reduce the width or height to stay within ${maxResizePixels.toLocaleString()} pixels total.`
  }
}

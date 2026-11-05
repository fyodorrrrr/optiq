// Match OPTIQ_PROFILE on the API; Vite embeds this public value at build time.
const name = import.meta.env.VITE_API_PROFILE ?? 'full'
if (name !== 'full' && name !== 'render-free') throw new Error('VITE_API_PROFILE must be full or render-free.')
export const renderFree = name === 'render-free'
export const maxImageSide = renderFree ? 1024 : 4096
export const maxImagePixels = renderFree ? 350_000 : 4_000_000
export function inputLimitsFor(pixelLimit = maxImagePixels) {
  return `PNG/JPEG inputs: up to 5 MiB, ${maxImageSide} pixels per side, and ${pixelLimit.toLocaleString()} pixels total.`
}
export const inputLimits = inputLimitsFor()

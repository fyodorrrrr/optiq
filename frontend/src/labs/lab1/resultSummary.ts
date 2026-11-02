import type { ExperimentResult, Frame } from './api'

export function resultSummary(original: Frame, output: ExperimentResult) {
  const dimensions = `${original.width} × ${original.height} → ${output.result.width} × ${output.result.height} px`
  switch (output.operation) {
    case 'resize': return `${dimensions}. The whole image was resampled using ${output.parameters.interpolation} interpolation. Both previews fit their panels.`
    case 'crop': return `${dimensions}. Only the selected region remains; its pixels were not rescaled. The preview fits the cropped image to its panel.`
    case 'rotate': {
      const angle = Number(output.parameters.quarter_turns ?? 1) * 90
      return angle === 0 ? `${dimensions}. Returned to the original orientation after a full turn.`
        : `${dimensions}. Rotated ${angle}° clockwise from the original; the same pixels are rearranged.`
    }
    case 'grayscale': return original.channels === 1
      ? 'The original is already grayscale, so the image is unchanged.'
      : 'Converted from 3 color channels to 1 grayscale channel. Width and height are unchanged.'
    case 'edit': return `Changed pixel (${output.pixel?.x}, ${output.pixel?.y}). Dimensions and neighboring pixels are unchanged; compare the magnified views below.`
    case 'inspect': return `Inspected pixel (${output.pixel?.x}, ${output.pixel?.y}). The image is unchanged; its values appear in the magnified views below.`
  }
}

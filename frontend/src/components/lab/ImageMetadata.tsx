import { useId } from 'react'
import type { ImageFrame } from '../../api/images'

export interface MetadataImage { label: string; frame: ImageFrame }

export function ImageMetadataHelp() {
  return <details className="lab-metadata-help"><summary>What do these values mean?</summary>
    <p>Dimensions list width × height. Array shape lists height, width, then channels for color images. BGR means blue, green, red; grayscale has one channel. uint8 stores whole-number values from 0 to 255.</p>
  </details>
}

export default function ImageMetadata({ frame, images, essential = false, showHelp = true, highlightChanges = false, caption = 'Image properties' }: {
  frame?: ImageFrame; images?: MetadataImage[]; essential?: boolean; wide?: boolean
  showHelp?: boolean; highlightChanges?: boolean; caption?: string
}) {
  const id = useId()
  const columns = images ?? (frame ? [{ label: 'Original', frame }] : [])
  if (!columns.length) return null
  const rows = [
    { label: 'Dimensions', value: (image: ImageFrame) => `${image.width} × ${image.height} px` },
    { label: 'Array shape', value: (image: ImageFrame) => `(${image.shape.join(', ')})` },
    { label: 'Channels', value: (image: ImageFrame) => `${image.channels} · ${image.color_space}` },
    ...(!essential ? [{ label: 'Data type', value: (image: ImageFrame) => image.dtype }] : []),
  ]

  return <>
    <table className="lab-metadata-table" role="table">
      <caption className="sr-only">{caption}</caption>
      <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader" id={`${id}-property`}>Property</th>
        {columns.map((image, index) => <th key={image.label} scope="col" role="columnheader" id={`${id}-image-${index}`}>{image.label}</th>)}
      </tr></thead>
      <tbody role="rowgroup">{rows.map((row, rowIndex) => <tr key={row.label} role="row">
        <th scope="row" role="rowheader" id={`${id}-row-${rowIndex}`}>{row.label}</th>
        {columns.map((image, index) => {
          const value = row.value(image.frame)
          const changed = highlightChanges && index > 0 && value !== row.value(columns[0].frame)
          return <td key={image.label} role="cell" headers={`${id}-row-${rowIndex} ${id}-image-${index}`} className={changed ? 'metadata-changed' : undefined}>
            <span className="metadata-mobile-label" aria-hidden="true">{image.label}</span><span>{value}</span>
          </td>
        })}
      </tr>)}</tbody>
    </table>
    {!essential && showHelp && <ImageMetadataHelp />}
  </>
}

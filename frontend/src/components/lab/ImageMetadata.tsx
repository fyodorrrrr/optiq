import type { ImageFrame } from '../../api/images'

export default function ImageMetadata({ frame, essential = false, wide = false }: { frame: ImageFrame; essential?: boolean; wide?: boolean }) {
  return <>
    <dl className={`lab-metadata${wide ? ' lab-metadata-wide' : ''}`}>
      <div><dt>Dimensions</dt><dd>{frame.width} × {frame.height} px</dd></div>
      <div><dt>Array shape</dt><dd>({frame.shape.join(', ')})</dd></div>
      <div><dt>Channels</dt><dd>{frame.channels} · {frame.color_space}</dd></div>
      {!essential && <div><dt>Data type</dt><dd>{frame.dtype}{frame.dtype === 'uint8' && <span className="lab-metadata-range">Supported range: <span className="lab-metadata-value-range">0–255</span></span>}</dd></div>}
    </dl>
    {!essential && <details className="lab-metadata-help"><summary>What do these values mean?</summary>
      <p>Dimensions list width × height. Array shape lists height, width, then channels for color images. BGR means blue, green, red; grayscale has one channel. uint8 stores whole-number values from 0 to 255.</p>
    </details>}
  </>
}

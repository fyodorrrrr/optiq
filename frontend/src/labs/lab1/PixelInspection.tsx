import type { ExperimentResult } from './api'

export default function PixelInspection({ pixel, busy, imageSize }: { pixel: ExperimentResult['pixel']; busy: boolean; imageSize?: { width: number; height: number } }) {
  const value = pixel?.before
  const rgb = value?.rgb ?? (value?.intensity !== null && value?.intensity !== undefined
    ? [value.intensity, value.intensity, value.intensity] : null)
  const replicatedEdges = pixel && imageSize && (pixel.x < 4 || pixel.y < 4
    || pixel.x + 4 >= imageSize.width || pixel.y + 4 >= imageSize.height)

  return <section className="pixel-inspection" aria-labelledby="pixel-inspection-title">
    <h3 id="pixel-inspection-title">Pixel values</h3>
    {pixel && value ? <div className="pixel-inspection-content">
      <div className="pixel-inspection-color">
        {rgb && <span className="pixel-inspection-swatch" style={{ backgroundColor: `rgb(${rgb.join(', ')})` }} aria-hidden="true" />}
        <strong>Pixel ({pixel.x}, {pixel.y})</strong>
      </div>
      <figure className="pixel-inspection-neighborhood">
        <div className="lab-zoom"><img src={pixel.before_zoom} alt={`Magnified neighborhood around pixel (${pixel.x}, ${pixel.y})`} /><span aria-hidden="true" /></div>
        <figcaption>9 × 9 neighborhood</figcaption>
      </figure>
      <dl className="pixel-inspection-values">
        {value.intensity !== null ? <div><dt>Intensity</dt><dd>{value.intensity}</dd></div> : <>
          <div><dt>RGB</dt><dd>[{value.rgb?.join(', ')}]</dd></div>
          <div><dt>BGR · OpenCV</dt><dd>[{value.bgr?.join(', ')}]</dd></div>
        </>}
      </dl>
    </div> : <p className="pixel-inspection-empty">{busy ? 'Reading pixel values…' : 'Choose a pixel, then select Inspect pixel to see its color and channel values.'}</p>}
    {value && replicatedEdges && <p className="pixel-inspection-note">Edge pixels are replicated to fill the zoom view.</p>}
  </section>
}

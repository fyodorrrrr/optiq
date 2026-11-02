import type { ExperimentResult, PixelValue } from './api'

function values(pixel: PixelValue) {
  return pixel.intensity !== null
    ? `Intensity: ${pixel.intensity}`
    : `BGR: [${pixel.bgr?.join(', ')}] · RGB: [${pixel.rgb?.join(', ')}]`
}

export default function PixelComparison({ pixel }: { pixel: NonNullable<ExperimentResult['pixel']> }) {
  return <section className="lab-pixels" aria-label="Magnified pixel comparison">
    <h3>Pixel ({pixel.x}, {pixel.y}) · 9 × 9 neighborhood</h3>
    <div className="lab-zoom-grid">{([
      ['Before', pixel.before_zoom, pixel.before], ['After', pixel.after_zoom, pixel.after],
    ] as const).map(([label, image, value]) => <figure key={label}>
      <div className="lab-zoom"><img src={image} alt={`${label}: nearest-neighbor magnified pixels`} /><span aria-hidden="true" /></div>
      <figcaption><strong>{label}</strong><p>{values(value)}</p></figcaption>
    </figure>)}</div>
    <p>The outlined center is the selected pixel. Edge pixels are replicated only to fill the zoom view.</p>
  </section>
}

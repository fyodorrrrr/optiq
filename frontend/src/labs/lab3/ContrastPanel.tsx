import type { ImageFrame } from '../../api/images'
import ImagePanel from '../../components/lab/ImagePanel'
import Histogram from '../../components/lab/Histogram'
import type { ContrastView } from './api'

export default function ContrastPanel({ title, view, original, pending, maxCount, channel, description }: {
  title: string; view: ContrastView | null; original?: ImageFrame | null; pending: boolean
  maxCount: number; channel: string; description: string
}) {
  return <section className="contrast-view" aria-label={`${title} comparison`}>
    <ImagePanel showMetadata={false} title={title} frame={view?.frame ?? original ?? null} description={description}
      empty={pending ? 'Processing…' : 'Run the comparison to see this result.'} />
    {view && <>
      <Histogram title={`${title} histogram`} counts={view.histogram} maxCount={maxCount} channel={channel} />
    </>}
  </section>
}

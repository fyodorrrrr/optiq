import type { ImageFrame } from '../../api/images'
import ImagePanel from '../../components/lab/ImagePanel'

export default function EdgeFigure({ title, frame, description, pending }: {
  title: string; frame: ImageFrame | null; description: string; pending?: boolean
}) {
  return <ImagePanel title={title} frame={frame} description={description}
    empty={pending ? 'Processing…' : 'Run both detectors to see the result.'} />
}

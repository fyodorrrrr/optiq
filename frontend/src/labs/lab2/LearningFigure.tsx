import { Arrow, Diagram, Label, PixelGrid } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'


const step = Array.from({ length: 5 }, () => [0, 0, 3, 3, 3])
const vertical = Array.from({ length: 5 }, () => [0, 0, 3, 0, 0])
const horizontal = [[0, 0, 0, 0, 0], [0, 0, 0, 0, 0], [3, 3, 3, 3, 3], [0, 0, 0, 0, 0], [0, 0, 0, 0, 0]]

export default function LearningFigure({ section }: { section: Section }) {
  if (section === 'canny') return <Diagram label="Hysteresis example: one strong response is connected to two weak responses, so all three survive. A separate weak response is discarded.">
    <path d="M80 110h150" stroke="var(--ink-soft)" strokeWidth="2" />
    {[80, 155, 230, 380].map((x, i) => <circle key={x} cx={x} cy="110" r="19" fill={i === 0 ? 'var(--accent)' : 'var(--paper-deep)'} stroke="var(--ink)" strokeWidth="2" />)}
    <Label x={80} y={65}>Strong</Label><Label x={192} y={65}>Connected weak</Label><Label x={380} y={65}>Isolated weak</Label>
    <path d="m368 98 24 24m0-24-24 24" stroke="var(--ink)" strokeWidth="2" />
    <Label x={155} y={175}>Keep connected chain</Label><Label x={380} y={175}>Discard</Label>
    <Label x={230} y={230}>Connection is checked after thinning</Label>
  </Diagram>
  if (section === 'sobel') return <Diagram label="Illustrative Sobel responses: the x derivative highlights a vertical boundary; the y derivative highlights a horizontal boundary.">
    <PixelGrid cells={vertical} x={52} y={53} /><PixelGrid cells={horizontal} x={298} y={53} />
    <Label x={107} y={30}>x derivative</Label><Label x={353} y={30}>y derivative</Label>
    <Label x={107}>Vertical boundary</Label><Label x={353}>Horizontal boundary</Label>
    <Label x={230} y={244}>Magnitude combines both directions</Label>
  </Diagram>
  if (section === 'preprocess') return <Diagram label="A sharp brightness step with one noisy pixel becomes a smoother transition. Both Sobel and Canny use this same smoothed image.">
    <PixelGrid cells={[[0, 0, 3, 3, 3], [0, 3, 3, 3, 3], ...step.slice(2)]} x={48} y={60} />
    <Arrow /><PixelGrid cells={Array.from({ length: 5 }, () => [0, 1, 2, 3, 3])} x={300} y={60} />
    <Label x={103}>Noisy step</Label><Label x={355}>Smoothed step</Label>
    <Label x={230} y={244}>Shared input → Sobel and Canny</Label>
  </Diagram>
  return <Diagram label="Illustrative comparison: Sobel shows a band of gradient strength around a boundary; Canny shows a thin binary boundary.">
    <PixelGrid cells={Array.from({ length: 5 }, () => [0, 1, 3, 1, 0])} x={52} y={55} />
    <PixelGrid cells={vertical} x={298} y={55} />
    <Label x={107}>Sobel: strength</Label><Label x={353}>Canny: thin edges</Label>
    <Label x={230} y={244}>Same input, different edge representations</Label>
  </Diagram>
}

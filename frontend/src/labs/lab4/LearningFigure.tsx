import { Arrow, Diagram, Label, PixelGrid } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'

const target = [[0, 0, 3, 0], [0, 3, 3, 0], [3, 3, 3, 3], [0, 0, 3, 0]]

export default function LearningFigure({ section }: { section: Section }) {
  if (section === 'orb') return <Diagram label="Four-bit descriptor fragments 1011 and 1001 differ in the third bit; their Hamming distance is one. Actual ORB descriptors contain 256 bits.">
    <Label x={230} y={42}>Binary descriptor fragments</Label>
    {['1011', '1001'].map((bits, row) => <g key={bits}>{bits.split('').map((bit, column) => <g key={column}>
      <rect x={110 + column * 60} y={65 + row * 60} width="48" height="44" fill="none" stroke={column === 2 ? 'var(--accent)' : 'var(--line-strong)'} strokeWidth="2" />
      <Label x={134 + column * 60} y={93 + row * 60}>{bit}</Label>
    </g>)}</g>)}
    <Label x={230} y={222}>One differing bit → distance 1</Label>
  </Diagram>
  if (section === 'sift') return <Diagram label="The same cross-shaped neighborhood at two scales. SIFT describes gradients relative to a feature's scale and orientation.">
    <PixelGrid cells={target} x={45} y={76} size={20} /><Arrow />
    <PixelGrid cells={target} x={285} y={50} size={32} />
    <Label x={85}>Small feature</Label><Label x={349}>Larger feature</Label><Label x={230} y={244}>Describe local gradient orientations</Label>
  </Diagram>
  if (section === 'surf') return <Diagram label="Illustrative SURF responses: a lower threshold keeps five candidate keypoints; a higher threshold keeps only the two stronger responses.">
    {[70, 320].map((x, panel) => <g key={x}>
      <rect x={x - 35} y="55" width="105" height="120" fill="none" stroke="var(--line-strong)" />
      {[[0, 0], [40, 10], [20, 60], [45, 85], [-10, 90]].slice(0, panel ? 2 : 5).map(([dx, dy], i) => <circle key={i} cx={x + dx} cy={75 + dy} r={i < 2 ? 9 : 5} fill="none" stroke="var(--accent)" strokeWidth="2" />)}
    </g>)}<Arrow /><Label x={87}>Lower threshold</Label><Label x={337}>Higher threshold</Label>
    <Label x={230} y={244}>Response strength is not match accuracy</Label>
  </Diagram>
  return <Diagram label="Three distinctive locations in image A connect to corresponding locations in a transformed image B. Lines illustrate candidate descriptor matches.">
    <rect x="35" y="50" width="125" height="125" fill="none" stroke="var(--ink-soft)" />
    <rect x="300" y="50" width="125" height="125" fill="none" stroke="var(--ink-soft)" />
    {[[65, 80, 340, 70], [130, 90, 390, 105], [95, 145, 345, 145]].map(([x, y, u, v]) => <g key={x}>
      <path d={`M${x} ${y} ${u} ${v}`} stroke="var(--accent)" strokeWidth="1.5" />
      <circle cx={x} cy={y} r="6" fill="var(--paper-deep)" stroke="var(--ink)" /><circle cx={u} cy={v} r="6" fill="var(--paper-deep)" stroke="var(--ink)" />
    </g>)}<Label x={97}>Image A</Label><Label x={362}>Image B</Label>
    <Label x={230} y={244}>Inspect correspondences, not only counts</Label>
  </Diagram>
}

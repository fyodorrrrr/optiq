import { Arrow, Bars, Diagram, Label, PixelGrid } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'


export default function LearningFigure({ section }: { section: Section }) {
  if (section === 'clahe') return <Diagram label="CLAHE illustration: a four-tile image uses local histograms. Histogram peaks are limited and neighboring mappings are blended.">
    <PixelGrid cells={[[0, 1, 2, 3], [1, 0, 3, 2], [2, 3, 1, 0], [3, 2, 0, 1]]} x={40} y={52} size={30} />
    <path d="M100 52v120M40 112h120" stroke="var(--ink)" strokeWidth="2" strokeDasharray="5 3" />
    <Arrow /><Bars x={288} values={[30, 65, 65, 65, 28]} />
    <path d="M288 109h140" stroke="var(--ink)" strokeDasharray="5 3" />
    <Label x={100}>Local tiles</Label><Label x={358}>Limit peaks</Label><Label x={230} y={244}>Blend neighboring mappings</Label>
  </Diagram>
  if (section === 'linear') return <Diagram label="Linear adjustment example with alpha 2 and beta minus 80: input values 40, 100, and 200 map to 0, 120, and clipped 255.">
    <Label x={230} y={40}>output = clip(2 × input − 80)</Label>
    {[['40', '0'], ['100', '120'], ['200', '255 · clipped']].map(([input, output], i) => <g key={input}>
      <Label x={100} y={95 + i * 55}>{input}</Label><Arrow x={205} y={90 + i * 55} /><Label x={350} y={95 + i * 55}>{output}</Label>
    </g>)}
  </Diagram>
  return <Diagram label={section === 'equalize' ? 'Illustrative histogram remapping: a narrow input distribution becomes more spread out, without guaranteeing a flat histogram.' : 'Illustrative brightness histograms: narrow input values compared with a broader distribution after enhancement. These are not computed image measurements.'}>
    <Bars x={35} values={[0, 0, 20, 105, 70, 0, 0]} /><Arrow />
    <Bars x={285} values={[35, 55, 25, 65, 30, 50, 35]} />
    <Label x={105}>Narrow range</Label><Label x={355}>Spread values</Label>
    <Label x={230} y={244}>{section === 'equalize' ? 'Use the cumulative distribution' : 'Look for detail and amplified noise'}</Label>
  </Diagram>
}

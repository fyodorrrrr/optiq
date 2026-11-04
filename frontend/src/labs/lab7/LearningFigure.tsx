import { Arrow, Diagram, Label, PixelGrid } from '../../components/lab/ConceptDiagram'
import type { Method } from './api'

const shape = [[0, 0, 0, 0, 0, 0], [0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 0], [0, 0, 0, 0, 0, 0]]
const regionColors = ['#f1f0eb', '#365c49', '#e4bd59', '#3167bf']

export default function LearningFigure({ section }: { section: Method }) {
  if (section === 'threshold') return <Diagram label="Illustrative threshold: grayscale values below a threshold become background; brighter values become foreground. A binary mask contains two groups, not object labels.">
    <PixelGrid cells={Array.from({ length: 5 }, () => [0, 1, 1, 2, 2, 3])} x={28} y={60} />
    <Arrow /><PixelGrid cells={Array.from({ length: 5 }, () => [0, 0, 0, 3, 3, 3])} x={295} y={60} />
    <Label x={94}>Brightness values</Label><Label x={361}>Binary mask</Label><Label x={230} y={245}>Separate values using a threshold</Label>
  </Diagram>
  if (section === 'region') return <Diagram label="Illustrative watershed: one connected foreground mask is divided into a green region and a yellow region by separate markers. Colors are arbitrary region IDs.">
    <PixelGrid cells={shape} x={28} y={60} palette={regionColors} /><Arrow />
    <PixelGrid cells={shape.map(row => row.map((value, column) => value && column > 2 ? 2 : value))} x={295} y={60} palette={regionColors} />
    <Label x={94}>One foreground</Label><Label x={361}>Two region IDs</Label><Label x={230} y={245}>Markers guide the separation</Label>
  </Diagram>
  if (section === 'edges') return <Diagram label="Illustrative edge filling: a boundary with a gap is open to exterior flood fill. A closed boundary can enclose a filled interior after small gaps are bridged.">
    <PixelGrid cells={[[0, 3, 3, 0, 0], [3, 0, 0, 0, 3], [3, 0, 0, 0, 3], [3, 0, 0, 0, 3], [0, 3, 3, 3, 0]]} x={43} y={60} />
    <Arrow /><PixelGrid cells={[[0, 3, 3, 3, 0], [3, 1, 1, 1, 3], [3, 1, 1, 1, 3], [3, 1, 1, 1, 3], [0, 3, 3, 3, 0]]} x={307} y={60} />
    <Label x={98}>Open boundary</Label><Label x={362}>Enclosed interior</Label><Label x={230} y={245}>Close small gaps, then fill</Label>
  </Diagram>
  return <Diagram label="Illustrative semantic class map: two disconnected green regions both represent the person class; a yellow region represents bus; other pixels are background. Class labels do not distinguish instances.">
    <PixelGrid cells={[[0, 0, 0, 0, 0, 0], [1, 0, 1, 0, 2, 2], [1, 0, 1, 0, 2, 2], [1, 0, 1, 0, 2, 2], [0, 0, 0, 0, 0, 0]]} x={38} y={58} size={25} palette={regionColors} />
    <rect x="253" y="67" width="18" height="18" fill={regionColors[1]} /><text x="284" y="82">Person</text>
    <rect x="253" y="109" width="18" height="18" fill={regionColors[2]} /><text x="284" y="124">Bus</text>
    <text x="253" y="166">Same class,</text><text x="253" y="190">different objects</text><Label x={230} y={245}>Class IDs do not identify instances</Label>
  </Diagram>
}

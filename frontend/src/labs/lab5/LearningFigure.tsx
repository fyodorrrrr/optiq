import { Arrow, Diagram, Label, PixelGrid } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'


export default function LearningFigure({ section }: { section: Section }) {
  if (section === 'variance') return <Diagram label="Illustrative cumulative explained variance curve rising toward 100 percent. A dashed 90 percent guide intersects the curve; no actual dataset threshold is claimed.">
    <path d="M65 42v145h330" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
    <path d="M65 68h330" stroke="var(--ink-soft)" strokeDasharray="5 4" />
    <path d="M65 182 100 130 140 100 185 81 230 68 285 57 340 48 395 44" fill="none" stroke="var(--accent)" strokeWidth="3" />
    <text x="18" y="73">90%</text><Label x={230} y={222}>Number of components →</Label><Label x={230} y={26}>Cumulative training variance</Label>
  </Diagram>
  if (section === 'recognition') return <Diagram label="Training-only model flow: training faces fit PCA and SVM. Held-out faces are transformed by that fitted PCA and predicted by that fitted SVM, then compared with test labels.">
    <Label x={90} y={48}>Training faces</Label><Arrow x={190} y={43} /><Label x={340} y={48}>Fit PCA + SVM</Label>
    <path d="M340 65v55" stroke="var(--accent)" strokeWidth="2" strokeDasharray="5 4" />
    <Label x={90} y={145}>Held-out faces</Label><Arrow x={190} y={140} /><Label x={340} y={140}>Transform</Label><Label x={340} y={166}>and predict</Label>
    <Label x={230} y={232}>Evaluate against held-out labels</Label>
  </Diagram>
  if (section === 'failures') return <Diagram label="Illustrative label comparison: actual identity A with prediction A is correct; actual identity A with prediction B is a mismatch to inspect.">
    <Label x={100} y={45}>Actual</Label><Label x={340} y={45}>Predicted</Label>
    <Label x={100} y={105}>Identity A</Label><Arrow x={205} y={100} /><Label x={340} y={105}>Identity A</Label>
    <Label x={100} y={170}>Identity A</Label><Arrow x={205} y={165} /><Label x={340} y={170}>Identity B</Label>
    <path d="M280 184h120" stroke="var(--accent)" strokeWidth="2" />
    <Label x={230} y={235}>Inspect the mismatch; describe a hypothesis</Label>
  </Diagram>
  return <Diagram label="Schematic PCA representation: a signed component grid has negative, zero, and positive weights. A centered face is represented by coefficients along learned component directions.">
    <PixelGrid cells={[[0, 1, 2, 1], [0, 1, 2, 2], [1, 1, 2, 2], [0, 1, 1, 2]]} x={45} y={58} size={28} palette={['#30342f', '#a6a6a1', '#f4f4ed']} />
    <Arrow /><Label x={350} y={94}>[w₁, w₂, …, wₖ]</Label><Label x={350} y={130}>Component weights</Label>
    <Label x={100}>− / 0 / + pattern</Label><Label x={230} y={244}>Center, then project onto learned directions</Label>
  </Diagram>
}

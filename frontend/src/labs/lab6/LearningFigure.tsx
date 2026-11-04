import { Arrow, Diagram, Label } from '../../components/lab/ConceptDiagram'
import type { Section } from './content'


export default function LearningFigure({ section }: { section: Section }) {
  if (section === 'dataset') return <Diagram label="Independent scenes assigned to separate splits: scenes A and B for training, scene C for validation, and scene D for an optional independent test. Avoid adjacent frames crossing splits.">
    {['Training', 'Validation', 'Optional test'].map((label, i) => <g key={label}>
      <rect x={20 + i * 150} y="55" width="120" height="110" fill="none" stroke="var(--ink-soft)" />
      <Label x={80 + i * 150} y={88}>{label}</Label>
      <Label x={80 + i * 150} y={133}>{['Scenes A, B', 'Scene C', 'Scene D'][i]}</Label>
    </g>)}<Label x={230} y={215}>Keep related frames in the same split</Label>
    <Label x={230} y={245}>Prevent leakage between scenes</Label>
  </Diagram>
  if (section === 'training') return <Diagram label="Local labeled examples train and save weights. A separate browser inference request uses the prepared saved weights on a new image. Evaluation uses its configured validation or test split.">
    <Label x={100} y={55}>Labeled examples</Label><Arrow x={205} y={50} /><Label x={345} y={55}>Local training</Label>
    <path d="M345 72v53" stroke="var(--accent)" strokeWidth="2" />
    <Label x={345} y={150}>Saved weights</Label><Arrow x={205} y={188} />
    <Label x={100} y={193}>New image</Label><Label x={345} y={193}>Inference</Label>
    <Label x={230} y={245}>Evaluate on the configured independent split</Label>
  </Diagram>
  return <Diagram label="Illustrative detection: a box within an input image is labeled bus with a model score of 0.82. The box provides location; the score does not guarantee correctness.">
    <rect x="70" y="45" width="320" height="140" fill="none" stroke="var(--ink-soft)" />
    <rect x="130" y="85" width="195" height="80" fill="var(--accent-soft)" stroke="var(--accent)" strokeWidth="2" />
    <text x="135" y="73">bus · score 0.82</text>
    <path d="M130 165 95 211M325 85l45-27" stroke="var(--ink-soft)" />
    <Label x={100} y={234}>Location</Label><Label x={347} y={28}>Class + score</Label>
  </Diagram>
}

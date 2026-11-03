import type { Dataset } from './api'
export default function DatasetView({ dataset }: { dataset?: Dataset }) {
  return <section><h2>Prepare your object dataset</h2><p>{dataset?.message ?? 'No custom dataset has been validated yet.'}</p>
    {dataset?.ready && <><p>Classes: {dataset.names?.join(' · ')}</p><div className="detection-table"><table><caption>Validated dataset counts</caption><thead><tr><th>Split</th><th>Images</th><th>Objects</th><th>Background images</th></tr></thead><tbody>{Object.entries(dataset.splits ?? {}).map(([split, counts]) => <tr key={split}><th scope="row">{split}</th><td>{counts.images}</td><td>{counts.objects}</td><td>{counts.backgrounds}</td></tr>)}</tbody></table></div></>}
    <p>Choose your object classes, collect varied images, and draw boxes with an annotation tool. Keep related scenes together when splitting the data.</p>
    <details className="lab-preprocessing"><summary>YOLO labels and folder structure</summary><pre><code>{`dataset/\n  data.yaml\n  images/train/    labels/train/\n  images/val/      labels/val/\n  images/test/     labels/test/  # optional, separate test split\n\n# One .txt label file per image; class IDs start at 0.\n# class_id x_center y_center width height\n0 0.5 0.5 0.4 0.3\n\n# data.yaml, relative to its folder\ntrain: images/train\nval: images/val\nnames: [bottle, notebook]`}</code></pre><p>Coordinates and sizes are divided by image width/height to lie between 0 and 1. The entire box must stay inside the image. Use an empty label file for an intentional background image.</p></details>
    <p>The validator checks labels, class IDs, image counts, and exact decoded-image duplicates. It cannot judge annotation quality or detect every similar scene.</p>
  </section>
}

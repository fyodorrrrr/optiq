import type { ReactNode } from 'react'

// Geometry for illustrative teaching figures, never computed experiment output.
export function Diagram({ label, children }: { label: string; children: ReactNode }) {
  return <svg className="learning-canvas-diagram" viewBox="0 0 460 260" role="img" aria-label={label}>{children}</svg>
}

export function Arrow({ x = 211, y = 118 }: { x?: number; y?: number }) {
  return <path d={`M${x} ${y}h36m-7-7 7 7-7 7`} fill="none" stroke="var(--accent)" strokeWidth="2" />
}

export function PixelGrid({ cells, x, y, size = 22, palette = ['#171717', '#525650', '#a8a8a3', '#f1f0eb'] }: {
  cells: number[][]; x: number; y: number; size?: number; palette?: string[]
}) {
  return <g transform={`translate(${x} ${y})`}>{cells.flatMap((row, r) => row.map((value, c) =>
    <rect key={`${r}-${c}`} x={c * size} y={r * size} width={size} height={size} fill={palette[value]} stroke="var(--paper-deep)" strokeWidth="1" />))}</g>
}

export function Label({ x, y = 208, children }: { x: number; y?: number; children: ReactNode }) {
  return <text x={x} y={y} textAnchor="middle">{children}</text>
}

export function Bars({ values, x, y = 174, width = 140 }: { values: number[]; x: number; y?: number; width?: number }) {
  const step = width / values.length
  return <g><path d={`M${x} ${y - 115}v115h${width}`} fill="none" stroke="var(--ink-soft)" />
    {values.map((value, i) => <rect key={i} x={x + i * step + 3} y={y - value} width={Math.max(1, step - 5)} height={value} fill="var(--accent)" />)}</g>
}

export interface LearningConcept {
  takeaway: string
  caption: string
  note: string
}

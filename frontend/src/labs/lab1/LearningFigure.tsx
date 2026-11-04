import type { ReactNode } from 'react'
import type { Operation } from './api'

// Fixed examples explain array operations; they are not experiment outputs.
const colors = ['#e5e5e2', '#d4493e', '#365c49', '#3167bf', '#e4bd59', '#8c637c']
const pixels = [[1, 2, 3], [4, 0, 5]]

function Grid({ cells = pixels, x, y, size = 44, selected, grayscale = false }: {
  cells?: number[][]; x: number; y: number; size?: number
  selected?: [number, number]; grayscale?: boolean
}) {
  return <g transform={`translate(${x} ${y})`}>
    {cells.flatMap((row, rowIndex) => row.map((color, columnIndex) => {
      const rgb = colors[color].slice(1).match(/../g)!.map(value => parseInt(value, 16))
      const intensity = Math.round(.299 * rgb[0] + .587 * rgb[1] + .114 * rgb[2])
      return <rect key={`${rowIndex}-${columnIndex}`} x={columnIndex * size} y={rowIndex * size}
        width={size} height={size} fill={grayscale ? `rgb(${intensity} ${intensity} ${intensity})` : colors[color]}
        stroke="var(--paper-deep)" strokeWidth="2" />
    }))}
    {selected && <rect x={selected[0] * size + 3} y={selected[1] * size + 3} width={size - 6} height={size - 6}
      stroke="var(--ink)" strokeWidth="2" fill="none" />}
  </g>
}

function Arrow({ x, y }: { x: number; y: number }) {
  return <path d={`M${x} ${y}h36m-7-7 7 7-7 7`} fill="none" stroke="var(--accent)" strokeWidth="2" />
}

function Figure({ label, children }: { label: string; children: ReactNode }) {
  return <svg className="learning-canvas-diagram" viewBox="0 0 460 240" role="img" aria-label={label}>
    {children}
  </svg>
}

export default function LearningFigure({ operation }: { operation: Operation }) {
  switch (operation) {
    case 'inspect':
      return <Figure label="A 3-column, 2-row image. The highlighted top-left pixel at x 0, y 0 has BGR values 62, 73, 212. NumPy accesses it as image[0, 0].">
        {[0, 1, 2].map(column => <text key={column} x={72 + column * 50} y="36" textAnchor="middle">{column}</text>)}
        {[0, 1].map(row => <text key={row} x="28" y={81 + row * 50} textAnchor="middle">{row}</text>)}
        <Grid x={47} y={49} size={50} selected={[0, 0]} />
        <path d="M73 74H236V87h25" fill="none" stroke="var(--ink)" strokeWidth="1.5" />
        <circle cx="73" cy="74" r="4" fill="var(--paper-deep)" stroke="var(--ink)" />
        <text x="276" y="80" className="learning-diagram-strong">One pixel</text>
        <text x="276" y="109" className="learning-diagram-code">[62, 73, 212]</text>
        <text x="276" y="136">blue · green · red</text>
        <text x="122" y="190" textAnchor="middle" className="learning-diagram-code">image[0, 0]</text>
        <text x="122" y="216" textAnchor="middle">row first, column second</text>
      </Figure>
    case 'edit':
      return <Figure label="Two 3 by 3 neighborhoods. Only the center pixel changes from blue to red; the eight surrounding pixels and the image dimensions stay the same.">
        <Grid cells={[[0, 2, 0], [2, 3, 0], [0, 0, 2]]} x={38} y={37} selected={[1, 1]} />
        <Arrow x={211} y={103} />
        <Grid cells={[[0, 2, 0], [2, 1, 0], [0, 0, 2]]} x={290} y={37} selected={[1, 1]} />
        <text x="104" y="204" textAnchor="middle">Before</text>
        <text x="356" y="204" textAnchor="middle">One value replaced</text>
      </Figure>
    case 'grayscale':
      return <Figure label="The same 3-column, 2-row image in color and in grayscale. Each group of three color values becomes one brightness value; the grid dimensions stay the same.">
        <Grid x={38} y={58} />
        <Arrow x={211} y={103} />
        <Grid x={290} y={58} grayscale />
        <text x="104" y="188" textAnchor="middle">3 color channels</text>
        <text x="356" y="188" textAnchor="middle">1 brightness channel</text>
        <text x="230" y="220" textAnchor="middle">Same width. Same height.</text>
      </Figure>
    case 'crop':
      return <Figure label="A crop keeps the rightmost 2 columns of a 3-column, 2-row image. The retained pixels keep their colors and size; pixels outside the crop are removed.">
        <Grid x={38} y={58} />
        <rect x="82" y="58" width="88" height="88" fill="none" stroke="var(--ink)" strokeWidth="3" strokeDasharray="6 4" />
        <Arrow x={211} y={103} />
        <Grid cells={pixels.map(row => row.slice(1))} x={312} y={58} />
        <text x="104" y="188" textAnchor="middle">Choose a region</text>
        <text x="356" y="188" textAnchor="middle">Keep its pixels</text>
      </Figure>
    case 'resize':
      return <Figure label="Nearest-neighbor resizing from 3 by 2 to 6 by 4 pixels. Each source pixel becomes a 2 by 2 block. The whole scene remains; no new detail is recovered.">
        <Grid x={32} y={77} size={36} />
        <Arrow x={185} y={113} />
        <Grid cells={pixels.flatMap(row => [row.flatMap(value => [value, value]), row.flatMap(value => [value, value])])} x={265} y={53} size={30} />
        <text x="86" y="205" textAnchor="middle">3 × 2 pixels</text>
        <text x="355" y="205" textAnchor="middle">6 × 4 pixels</text>
      </Figure>
    case 'rotate':
      return <Figure label="A 90-degree clockwise rotation rearranges a 3-column, 2-row grid into 2 columns and 3 rows. All six pixel colors are preserved.">
        <Grid x={38} y={72} />
        <Arrow x={211} y={116} />
        <Grid cells={pixels[0].map((_, column) => pixels.map(row => row[column]).reverse())} x={312} y={50} />
        <text x="104" y="210" textAnchor="middle">3 wide × 2 tall</text>
        <text x="356" y="210" textAnchor="middle">2 wide × 3 tall</text>
        <text x="230" y="41" textAnchor="middle">90° clockwise</text>
      </Figure>
  }
}

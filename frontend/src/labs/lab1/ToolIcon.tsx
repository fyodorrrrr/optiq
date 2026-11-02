import type { Operation } from './api'

const paths: Record<Operation, string> = {
  inspect: 'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14Zm5 12 6 6M7 10h6m-3-3v6',
  edit: 'm15 4 5 5M4 15 15 4a3.5 3.5 0 0 1 5 5L9 20l-6 1 1-6Z',
  grayscale: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm0 0v18m3-16v14m3-11v8',
  crop: 'M6 3v15h15M3 6h15v15',
  resize: 'M9 3H3v6m12 12h6v-6M3 3l7 7m11 11-7-7M15 3h6v6M3 15v6h6',
  rotate: 'M20 8V3m0 5h-5M20 8a9 9 0 1 0 1 7',
}

export default function ToolIcon({ operation }: { operation: Operation }) {
  return <svg className="lab-tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={paths[operation]} />
  </svg>
}

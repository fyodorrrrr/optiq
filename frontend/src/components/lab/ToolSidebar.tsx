import { useId } from 'react'
import type { ReactNode } from 'react'

export default function ToolSidebar<T extends string>({ tools, value, onChange, label = 'Choose an experiment', heading = 'Experiments' }: {
  tools: { id: T; label: string; icon: ReactNode }[]; value: T; onChange: (id: T) => void; label?: string; heading?: string
}) {
  const titleId = useId()
  return <aside className="lab-tool-sidebar" aria-labelledby={titleId}>
    <h2 id={titleId}>{heading}</h2>
    <div className="lab-tools" role="group" aria-label={label}>
      {tools.map(tool => <button key={tool.id} type="button" aria-pressed={value === tool.id} onClick={() => onChange(tool.id)}>
        {tool.icon}<span>{tool.label}</span>
      </button>)}
    </div>
  </aside>
}

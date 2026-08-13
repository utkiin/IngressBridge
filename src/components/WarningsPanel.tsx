import { useState } from 'react'

interface WarningsPanelProps {
  warnings: string[]
}

export function WarningsPanel({ warnings }: WarningsPanelProps) {
  const [open, setOpen] = useState(true)
  if (warnings.length === 0) return null

  return (
    <div className="animate-fade-in-up rounded-xl border border-amber-300/60 bg-amber-50/70 dark:border-amber-500/30 dark:bg-amber-500/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
          <svg viewBox="0 0 24 24" fill="none" strokeWidth="2" stroke="currentColor" className="size-4 shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1 1 0 0 0 .86 1.5h18.64a1 1 0 0 0 .86-1.5L13.71 3.86a1 1 0 0 0-1.72 0Z" />
          </svg>
          {warnings.length} {warnings.length === 1 ? 'thing needs' : 'things need'} a manual look
        </span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          strokeWidth="2"
          stroke="currentColor"
          className={`size-4 shrink-0 text-amber-500 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <div className={`grid overflow-hidden transition-all duration-300 ease-out ${open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0">
          <ul className="space-y-2 border-t border-amber-300/50 px-4 py-3 text-[13px] leading-relaxed text-amber-900/90 dark:border-amber-500/20 dark:text-amber-200/90">
            {warnings.map((w, i) => (
              <li key={i} className="flex gap-2">
                <span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" />
                <span>{w}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

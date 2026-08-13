import { useEffect } from 'react'

interface AdSlotProps {
  variant?: 'leaderboard' | 'rectangle' | 'banner'
  className?: string
  /** Render the real Monetag zone here instead of the placeholder. Only one slot should set this. */
  live?: boolean
}

const placeholderSizes: Record<NonNullable<AdSlotProps['variant']>, string> = {
  leaderboard: 'h-[90px] max-w-[728px]',
  rectangle: 'h-[250px] max-w-[300px]',
  banner: 'h-[90px] max-w-full',
}

/** Monetag "Banner" zone — https://monetag.com/ */
const MONETAG_CONTAINER_ID = 'container-c3cd65e18d094916e8b3ac5f60b58030'
const MONETAG_SCRIPT_SRC = 'https://pl30835460.effectivecpmnetwork.com/c3cd65e18d094916e8b3ac5f60b58030/invoke.js'

function useMonetagScript(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    if (document.querySelector(`script[src="${MONETAG_SCRIPT_SRC}"]`)) return
    const script = document.createElement('script')
    script.async = true
    script.setAttribute('data-cfasync', 'false')
    script.src = MONETAG_SCRIPT_SRC
    document.body.appendChild(script)
  }, [enabled])
}

export function AdSlot({ variant = 'banner', className = '', live = false }: AdSlotProps) {
  useMonetagScript(live)

  if (live) {
    return (
      <div className={`mx-auto flex w-full flex-col items-center gap-1 ${className}`}>
        <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-600">Advertisement</span>
        <div id={MONETAG_CONTAINER_ID} className="w-full" />
      </div>
    )
  }

  return (
    <div
      className={`mx-auto flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-600 ${placeholderSizes[variant]} ${className}`}
      aria-hidden="true"
    >
      Advertisement
    </div>
  )
}

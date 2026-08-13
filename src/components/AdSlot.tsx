import { useId } from 'react'

interface AdSlotProps {
  variant?: 'leaderboard' | 'rectangle' | 'banner'
  className?: string
}

/** A-ADS (a-ads.com) adaptive ad unit — https://aads.com/ru/ad-units/ */
const AADS_UNIT_ID = '2452053'
const AADS_HOST = 'acceptable.a-ads.com'

const containerSizes: Record<NonNullable<AdSlotProps['variant']>, string> = {
  leaderboard: 'max-w-[728px]',
  rectangle: 'max-w-[300px]',
  banner: 'max-w-full',
}

export function AdSlot({ variant = 'banner', className = '' }: AdSlotProps) {
  const frameId = useId()

  if (!AADS_UNIT_ID) {
    return (
      <div
        className={`mx-auto flex h-[90px] w-full items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-600 ${containerSizes[variant]} ${className}`}
        aria-hidden="true"
      >
        Advertisement
      </div>
    )
  }

  return (
    <div className={`mx-auto w-full ${containerSizes[variant]} ${className}`}>
      <span className="mb-1 block text-center text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-600">
        Advertisement
      </span>
      <div id={frameId} style={{ width: '100%', margin: 'auto', position: 'relative', zIndex: 1 }}>
        <iframe
          title="Advertisement"
          data-aa={AADS_UNIT_ID}
          src={`https://${AADS_HOST}/${AADS_UNIT_ID}/?size=Adaptive`}
          style={{ border: 0, padding: 0, width: '100%', height: 'auto', overflow: 'hidden', display: 'block', margin: 'auto' }}
        />
      </div>
    </div>
  )
}

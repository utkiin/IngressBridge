interface AdSlotProps {
  variant?: 'leaderboard' | 'rectangle' | 'banner'
  className?: string
}

/**
 * A-ADS (a-ads.com) unit id — sign up, create an ad unit, and paste its id here.
 * Left blank on purpose: until it's set, every slot renders the neutral
 * "Advertisement" placeholder below instead of a broken iframe.
 */
const AADS_UNIT_ID = ''

const placeholderSizes: Record<NonNullable<AdSlotProps['variant']>, string> = {
  leaderboard: 'h-[90px] max-w-[728px]',
  rectangle: 'h-[250px] max-w-[300px]',
  banner: 'h-[60px] max-w-full',
}

const aadsDimensions: Record<NonNullable<AdSlotProps['variant']>, { width: number; height: number }> = {
  leaderboard: { width: 728, height: 90 },
  rectangle: { width: 300, height: 250 },
  banner: { width: 468, height: 60 },
}

export function AdSlot({ variant = 'banner', className = '' }: AdSlotProps) {
  if (!AADS_UNIT_ID) {
    return (
      <div
        className={`mx-auto flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-600 ${placeholderSizes[variant]} ${className}`}
        aria-hidden="true"
      >
        Advertisement
      </div>
    )
  }

  const { width, height } = aadsDimensions[variant]

  return (
    <div className={`mx-auto flex w-full flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-600">Advertisement</span>
      <iframe
        title="Advertisement"
        data-aa={AADS_UNIT_ID}
        src={`https://ad.a-ads.com/${AADS_UNIT_ID}?size=${width}x${height}`}
        style={{ width, height, maxWidth: '100%', border: 0, padding: 0, overflow: 'hidden' }}
        scrolling="no"
      />
    </div>
  )
}

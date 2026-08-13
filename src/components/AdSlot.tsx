interface AdSlotProps {
  variant?: 'leaderboard' | 'rectangle' | 'banner'
  className?: string
}

const placeholderSizes: Record<NonNullable<AdSlotProps['variant']>, string> = {
  leaderboard: 'h-[90px] max-w-[728px]',
  rectangle: 'h-[250px] max-w-[300px]',
  banner: 'h-[90px] max-w-full',
}

/**
 * Ad placeholder — Monetag integration pending. Swap this component's body
 * for the Monetag embed snippet (zone/site verification code) once available.
 */
export function AdSlot({ variant = 'banner', className = '' }: AdSlotProps) {
  return (
    <div
      className={`mx-auto flex w-full items-center justify-center rounded-xl border border-dashed border-slate-300/70 bg-slate-50/60 text-[11px] uppercase tracking-wider text-slate-400 dark:border-slate-700/70 dark:bg-slate-900/40 dark:text-slate-600 ${placeholderSizes[variant]} ${className}`}
      aria-hidden="true"
    >
      Advertisement
    </div>
  )
}

import { cn } from '../lib/utils'

/**
 * ARCAVIA QUEST wordmark. The Figma uses a decorative serif logo image; this is
 * a typographic stand-in until the brand asset is exported into /public.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <div className={cn('text-center', className)}>
      <p className="text-[34px] font-bold uppercase leading-none tracking-[0.08em] text-cream">
        Arcavia
      </p>
      <p className="text-[34px] font-bold uppercase leading-none tracking-[0.18em] text-gold">
        Quest
      </p>
    </div>
  )
}

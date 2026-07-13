import { cn } from '../lib/utils'
import { useT } from '../lib/i18n'

/** Repeated static "Términos y condiciones" footer link (spec §6). */
export function TermsFooterLink({ className }: { className?: string }) {
  const t = useT()
  return (
    <a
      href="/terminos"
      className={cn('block text-center text-[12px] text-cream/60 underline', className)}
    >
      {t('common.terms')}
    </a>
  )
}

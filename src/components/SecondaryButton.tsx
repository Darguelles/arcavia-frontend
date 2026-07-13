import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

/**
 * Outline CTA — the gold-bordered, cream-text variant ("Iniciar campaña" in
 * Figma). Same geometry as PrimaryButton (spec §6).
 */
export function SecondaryButton({
  children,
  loading = false,
  fullWidth = true,
  disabled,
  className,
  ...props
}: SecondaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex h-[45px] items-center justify-center rounded-[5px] px-6',
        'border border-gold bg-transparent font-semibold text-[16px] text-cream',
        'transition-colors hover:bg-gold/10 active:bg-gold/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? '…' : children}
    </button>
  )
}

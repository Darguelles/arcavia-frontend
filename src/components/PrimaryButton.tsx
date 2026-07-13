import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../lib/utils'

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  fullWidth?: boolean
}

/**
 * Filled CTA — the `bg-gold` + black-text button seen under every primary
 * action in Figma (rounded-5px, h-45). Build once, theme via props (spec §6).
 */
export function PrimaryButton({
  children,
  loading = false,
  fullWidth = true,
  disabled,
  className,
  ...props
}: PrimaryButtonProps) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        'inline-flex h-[45px] items-center justify-center rounded-[5px] bg-gold px-6',
        'font-semibold text-[16px] text-black transition-colors',
        'hover:bg-gold-soft active:bg-gold-soft',
        'disabled:cursor-not-allowed disabled:opacity-50',
        fullWidth && 'w-full',
        className
      )}
    >
      {loading ? '…' : children}
    </button>
  )
}

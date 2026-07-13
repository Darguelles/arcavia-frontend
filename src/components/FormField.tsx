import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '../lib/utils'

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
}

/** Labeled text input styled for the ink/cream form screens (register, login). */
export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, className, id, ...props },
  ref
) {
  const inputId = id ?? props.name
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-[14px] font-medium text-cream">
        {label}
      </label>
      <input
        {...props}
        id={inputId}
        ref={ref}
        aria-invalid={!!error}
        className={cn(
          'h-[45px] rounded-[5px] border border-cream/20 bg-ink-card px-4 text-[15px] text-cream',
          'placeholder:text-cream/40 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold',
          error && 'border-incorrect focus:border-incorrect focus:ring-incorrect',
          className
        )}
      />
      {error && <p className="text-[12px] text-incorrect">{error}</p>}
    </div>
  )
})

import { useState } from 'react'
import { cn } from '../lib/utils'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

/** Initials from a display name, e.g. "Ana Ruiz" → "AR". */
function initials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

/**
 * Circular avatar (spec §6). Falls back to initials on a gold disc when
 * `src` is null or the image fails to load.
 */
export function Avatar({ src, name, size = 40, className }: AvatarProps) {
  const [errored, setErrored] = useState(false)
  const showImage = src && !errored
  const dimension = { width: size, height: size }

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gold',
        className
      )}
      style={dimension}
      aria-label={name ?? undefined}
    >
      {showImage ? (
        <img
          src={src}
          alt={name ?? ''}
          loading="lazy"
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
          style={dimension}
        />
      ) : (
        <span className="font-semibold text-black" style={{ fontSize: Math.max(11, size * 0.4) }}>
          {initials(name)}
        </span>
      )}
    </div>
  )
}

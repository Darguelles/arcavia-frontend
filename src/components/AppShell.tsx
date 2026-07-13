import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'
import { useAuthStore } from '../stores/authStore'
import { Avatar } from './Avatar'

interface AppShellProps {
  children: ReactNode
  // Show the circular back button in the header.
  back?: boolean
  onBack?: () => void
  // Show the avatar circle (opens the menu) in the header.
  showAvatar?: boolean
  // Optional centered header title.
  title?: string
  className?: string
  // Remove the default horizontal gutter (e.g. full-bleed map screens).
  bleed?: boolean
}

/**
 * Player app frame (spec §6): fixed 402px mobile canvas on ink, top nav header
 * (back-arrow circle + avatar circle), and bottom safe-area padding for iOS.
 */
export function AppShell({
  children,
  back = false,
  onBack,
  showAvatar = false,
  title,
  className,
  bleed = false,
}: AppShellProps) {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const handleBack = () => (onBack ? onBack() : navigate(-1))

  return (
    <div className="relative flex min-h-dvh w-full max-w-[402px] flex-col bg-ink text-cream">
      {(back || showAvatar || title) && (
        <header
          className="sticky top-0 z-20 flex items-center justify-between px-5 pb-2 pt-[env(safe-area-inset-top,12px)]"
          style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
        >
          <div className="flex h-10 w-10 items-center">
            {back && (
              <button
                type="button"
                onClick={handleBack}
                aria-label="Volver"
                className="flex h-10 w-10 items-center justify-center rounded-full bg-ink-card text-cream transition-colors hover:bg-gold hover:text-black"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            )}
          </div>

          {title && <h1 className="font-bold text-[18px] text-cream">{title}</h1>}

          <div className="flex h-10 w-10 items-center justify-end">
            {showAvatar && (
              <button
                type="button"
                onClick={() => navigate('/menu')}
                aria-label="Menú"
                className="rounded-full"
              >
                <Avatar src={user?.avatar_url} name={user?.display_name} size={40} />
              </button>
            )}
          </div>
        </header>
      )}

      <main
        className={cn(
          'flex-1',
          !bleed && 'px-5',
          'pb-[max(20px,env(safe-area-inset-bottom))]',
          className
        )}
      >
        {children}
      </main>
    </div>
  )
}

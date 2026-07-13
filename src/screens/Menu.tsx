import { useNavigate } from 'react-router-dom'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { useAuthStore } from '../stores/authStore'
import { useMyProgress } from '../api/gameplay'
import { useLogout } from '../api/auth'
import { useCitySessionStore } from '../stores/citySessionStore'

/*
 * MENU (drawer/screen) — Figma frame 135:619. Profile summary + nav to
 * /profile, /ranking, /rewards ("Mis cupones"), /account/settings (spec §8.10),
 * plus logout (milestone 1).
 */

interface Row {
  title: string
  subtitle: string
  to: string
}

const ROWS: Row[] = [
  { title: 'Perfil', subtitle: 'Puntos, misiones...', to: '/profile' },
  { title: 'Ranking', subtitle: 'Tabla de puestos de los jugadores', to: '/ranking' },
  { title: 'Mis cupones', subtitle: 'Cupones obtenidos de las misiones', to: '/rewards' },
  { title: 'Datos personales', subtitle: 'Editar email, contraseña...', to: '/account/settings' },
]

export function Menu() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const city = useCitySessionStore((s) => s.city)
  const { data: progress } = useMyProgress()
  const logout = useLogout()

  const stats = [
    { label: 'Puntos', value: progress?.total_points ?? 0 },
    { label: 'Misiones', value: progress?.missions_completed ?? 0 },
    { label: 'Desafíos', value: progress?.challenges_completed ?? 0 },
  ]

  const handleLogout = () => logout.mutate(undefined, { onSuccess: () => navigate('/') })

  return (
    <AppShell back>
      <div className="flex flex-col items-center gap-1 pt-2">
        <Avatar src={user?.avatar_url} name={user?.display_name} size={90} />
        <h1 className="mt-3 text-[34px] font-bold text-cream">
          {user?.display_name ?? 'Explorador'}
        </h1>
        <p className="text-[16px] text-cream/80">Descripción del jugador</p>
        {city && <p className="text-[12px] text-gold">{city.name}</p>}
      </div>

      {/* Stat cards */}
      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="flex flex-col items-center justify-center rounded-[5px] bg-[#f3efe6] py-3"
          >
            <span className="text-[10px] text-ink">{s.label}</span>
            <span className="text-[24px] font-bold text-gold">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Nav rows */}
      <nav className="mt-6 flex flex-col gap-4">
        {ROWS.map((row) => (
          <button
            key={row.to}
            type="button"
            onClick={() => navigate(row.to)}
            className="flex items-center justify-between rounded-[5px] bg-ink-card px-4 py-3 text-left transition-colors hover:bg-ink-card/70"
          >
            <span>
              <span className="block text-[14px] font-bold text-cream">{row.title}</span>
              <span className="block text-[14px] text-cream/70">{row.subtitle}</span>
            </span>
            <ArrowUpRight />
          </button>
        ))}
      </nav>

      <button
        type="button"
        onClick={handleLogout}
        disabled={logout.isPending}
        className="mt-8 w-full rounded-[5px] border border-incorrect/60 py-3 text-[14px] font-semibold text-incorrect disabled:opacity-50"
      >
        Cerrar sesión
      </button>
    </AppShell>
  )
}

function ArrowUpRight() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="text-cream"
    >
      <path
        d="M7 17L17 7M17 7H8M17 7v9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

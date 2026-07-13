import { useAuthStore } from '../stores/authStore'
import { useCitySessionStore } from '../stores/citySessionStore'

/**
 * Lightweight UI-chrome i18n (buttons, nav, labels) — spec §12. Content strings
 * (mission/challenge copy) do NOT go here; those come from the API's per-locale
 * `translations` blob via pickTranslation(). Locale resolves from the user's
 * account, then the selected city's default, then 'es'.
 */

const dictionaries = {
  es: {
    'nav.back': 'Volver',
    'nav.menu': 'Menú',
    'auth.login': 'Iniciar sesión',
    'auth.register': 'Registrarse',
    'auth.logout': 'Cerrar sesión',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.name': 'Nombre',
    'auth.birthDate': 'Fecha de nacimiento',
    'auth.consent': 'Acepto los términos y condiciones',
    'auth.forgot': 'Olvidé mi contraseña',
    'auth.noAccount': '¿No tienes cuenta?',
    'auth.hasAccount': '¿Ya tienes cuenta?',
    'home.startCampaign': 'Iniciar campaña',
    'home.register': 'Regístrate',
    'common.terms': 'Términos y condiciones',
    'common.loading': 'Cargando…',
    'common.retry': 'Reintentar',
    'common.offline': 'Sin conexión',
    'missions.title': 'Misiones',
    'missions.explorers': 'exploradores',
    'missions.points': 'pts',
    'missions.start': 'Iniciar misión',
    'mission.objectives': 'Objetivos',
    'mission.rewards': 'Recompensas disponibles',
    'waypoint.complete': 'Completa el desafío',
    'waypoint.back': 'Volver a la ruta',
    'challenge.needConnection': 'Necesitas conexión para escanear.',
    'result.backToMap': 'Regresar al mapa',
    'profile.title': 'Perfil',
    'profile.points': 'puntos',
    'profile.missions': 'Misiones',
    'profile.challenges': 'Desafíos',
    'rewards.title': 'Mis cupones',
    'rewards.empty': 'Aún no tienes cupones. ¡Explora misiones para ganarlos!',
    'ranking.title': 'Ranking',
  },
  en: {
    'nav.back': 'Back',
    'nav.menu': 'Menu',
    'auth.login': 'Log in',
    'auth.register': 'Sign up',
    'auth.logout': 'Log out',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Name',
    'auth.birthDate': 'Date of birth',
    'auth.consent': 'I accept the terms and conditions',
    'auth.forgot': 'Forgot my password',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'home.startCampaign': 'Start campaign',
    'home.register': 'Sign up',
    'common.terms': 'Terms and conditions',
    'common.loading': 'Loading…',
    'common.retry': 'Retry',
    'common.offline': 'Offline',
    'missions.title': 'Missions',
    'missions.explorers': 'explorers',
    'missions.points': 'pts',
    'missions.start': 'Start mission',
    'mission.objectives': 'Objectives',
    'mission.rewards': 'Available rewards',
    'waypoint.complete': 'Complete the challenge',
    'waypoint.back': 'Back to route',
    'challenge.needConnection': 'You need a connection to scan.',
    'result.backToMap': 'Back to map',
    'profile.title': 'Profile',
    'profile.points': 'points',
    'profile.missions': 'Missions',
    'profile.challenges': 'Challenges',
    'rewards.title': 'My coupons',
    'rewards.empty': "You don't have coupons yet. Explore missions to earn them!",
    'ranking.title': 'Ranking',
  },
} as const

type Lang = keyof typeof dictionaries
export type TranslationKey = keyof (typeof dictionaries)['es']

function langFromLocale(locale: string | undefined): Lang {
  const lang = (locale ?? 'es').split('-')[0]
  return lang in dictionaries ? (lang as Lang) : 'es'
}

/** Resolve the active UI locale (account override → city default → 'es'). */
export function useLocale(): string {
  const accountLocale = useAuthStore((s) => s.user?.locale)
  const cityLocale = useCitySessionStore((s) => s.city?.default_locale)
  return accountLocale ?? cityLocale ?? 'es'
}

/** Translate a UI-chrome key for the active locale. */
export function useT(): (key: TranslationKey) => string {
  const locale = useLocale()
  const lang = langFromLocale(locale)
  return (key) => dictionaries[lang][key] ?? dictionaries.es[key] ?? key
}

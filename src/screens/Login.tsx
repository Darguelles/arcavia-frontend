import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useLogin } from '../api/auth'
import { ApiClientError } from '../api/client'
import { PrimaryButton } from '../components/PrimaryButton'
import { FormField } from '../components/FormField'
import { TermsFooterLink } from '../components/TermsFooterLink'
import { Wordmark } from '../components/Wordmark'
import { loginSchema, type LoginForm } from '../lib/validation'

/*
 * INGRESO (/login) — Figma frame 26:4.
 * The Figma label reads "Nombre o Usuario", but the API authenticates by email
 * + password (§8.3), so the field is an email input labeled accordingly.
 */
export function Login() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const returnTo = params.get('returnTo')
  const login = useLogin()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) })

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => navigate(returnTo ? decodeURIComponent(returnTo) : '/missions'),
    })
  })

  const serverError =
    login.error instanceof ApiClientError
      ? login.error.message
      : login.error
        ? 'No se pudo iniciar sesión.'
        : null

  return (
    <div className="flex min-h-dvh w-full max-w-[402px] flex-col bg-ink px-[41px] pb-8 pt-20 text-cream">
      <Wordmark className="mb-6" />
      <p className="mb-10 text-center text-[14px] leading-6 text-cream/80">
        Bienvenido de vuelta. Continúa tu aventura urbana.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
        <FormField
          label="Correo electrónico"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />

        {serverError && <p className="text-[13px] text-incorrect">{serverError}</p>}

        <PrimaryButton type="submit" loading={login.isPending} className="mt-2">
          Iniciar sesión
        </PrimaryButton>
      </form>

      {/* No forgot-password endpoint yet (§8.3) — route to support, not a dead flow. */}
      <a
        href="mailto:soporte@arcavia.app?subject=Recuperar%20contrase%C3%B1a"
        className="mt-4 text-[12px] text-cream/70 underline"
      >
        *Olvidé mi contraseña, deseo recuperarla.
      </a>

      <p className="mt-6 text-[13px] text-cream/80">
        ¿No tienes cuenta?{' '}
        <Link to="/register" className="font-semibold text-gold underline">
          Regístrate
        </Link>
      </p>

      <div className="flex-1" />
      <TermsFooterLink className="pt-8" />
    </div>
  )
}

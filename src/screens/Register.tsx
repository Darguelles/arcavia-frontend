import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../api/auth'
import { ApiClientError } from '../api/client'
import { PrimaryButton } from '../components/PrimaryButton'
import { FormField } from '../components/FormField'
import { TermsFooterLink } from '../components/TermsFooterLink'
import { Wordmark } from '../components/Wordmark'
import { CONSENT_VERSION } from '../config'
import { useLocale } from '../lib/i18n'
import { registerSchema, type RegisterForm } from '../lib/validation'

/*
 * FORMULARIO DE REGISTO (/register) — Figma frame 5:2.
 * The Figma "Edad" field is collected as a birth_date DATE PICKER (the API
 * stores birth_date, §6.10), plus a required consent checkbox the mockup omits
 * but the API mandates (§8.2/§11).
 */
export function Register() {
  const navigate = useNavigate()
  const locale = useLocale()
  const signup = useRegister()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema) })

  const onSubmit = handleSubmit((values) => {
    signup.mutate(
      {
        display_name: values.display_name,
        email: values.email,
        birth_date: values.birth_date,
        password: values.password,
        locale,
        consent_version: CONSENT_VERSION,
      },
      { onSuccess: () => navigate('/missions') }
    )
  })

  const serverError =
    signup.error instanceof ApiClientError
      ? signup.error.message
      : signup.error
        ? 'No se pudo completar el registro.'
        : null

  return (
    <div className="flex min-h-dvh w-full max-w-[402px] flex-col bg-ink px-[41px] pb-8 pt-16 text-cream">
      <Wordmark className="mb-4" />
      <p className="mb-8 text-center text-[14px] leading-6 text-cream/80">
        Crea tu cuenta y empieza a explorar la ciudad.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
        <FormField
          label="Nombre y apellido"
          autoComplete="name"
          {...register('display_name')}
          error={errors.display_name?.message}
        />
        <FormField
          label="Correo"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <FormField
          label="Fecha de nacimiento"
          type="date"
          {...register('birth_date')}
          error={errors.birth_date?.message}
        />
        <FormField
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
        />

        <label className="flex items-start gap-2 text-[13px] text-cream/85">
          <input
            type="checkbox"
            {...register('consent')}
            className="mt-0.5 h-4 w-4 rounded border-cream/30 bg-ink-card text-gold focus:ring-gold"
          />
          <span>
            Acepto los{' '}
            <a href="/terminos" className="text-gold underline">
              términos y condiciones
            </a>
          </span>
        </label>
        {errors.consent && <p className="text-[12px] text-incorrect">{errors.consent.message}</p>}

        {serverError && <p className="text-[13px] text-incorrect">{serverError}</p>}

        <PrimaryButton type="submit" loading={signup.isPending} className="mt-2">
          Registrarme
        </PrimaryButton>
      </form>

      <p className="mt-5 text-[13px] text-cream/80">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-semibold text-gold underline">
          Iniciar sesión
        </Link>
      </p>

      <div className="flex-1" />
      <TermsFooterLink className="pt-6" />
    </div>
  )
}

import { useForm } from 'react-hook-form'
import { AppShell } from '../components/AppShell'
import { FormField } from '../components/FormField'
import { PrimaryButton } from '../components/PrimaryButton'
import { ApiClientError } from '../api/client'
import { useAccount, useSetPassword, useUpdateAccount } from '../api/account'

/*
 * Datos personales (/account/settings) — spec §8.13.
 * Edit display_name/locale (PATCH /account) and change password
 * (POST /account/password). email and birth_date are IMMUTABLE after
 * registration (§6.10) — shown read-only.
 */
export function AccountSettings() {
  const { data: user } = useAccount()
  const updateAccount = useUpdateAccount()
  const setPassword = useSetPassword()

  const profileForm = useForm<{ display_name: string; locale: string }>({
    values: { display_name: user?.display_name ?? '', locale: user?.locale ?? 'es' },
  })

  const passwordForm = useForm<{ current_password: string; new_password: string }>({
    defaultValues: { current_password: '', new_password: '' },
  })

  const saveProfile = profileForm.handleSubmit((v) =>
    updateAccount.mutate({ display_name: v.display_name, locale: v.locale })
  )

  const changePassword = passwordForm.handleSubmit((v) =>
    setPassword.mutate(
      { current_password: v.current_password, new_password: v.new_password },
      { onSuccess: () => passwordForm.reset() }
    )
  )

  const pwError = setPassword.error instanceof ApiClientError ? setPassword.error.message : null

  return (
    <AppShell back title="Datos personales">
      <div className="flex flex-col gap-8 py-4">
        {/* Profile */}
        <form onSubmit={saveProfile} className="flex flex-col gap-4">
          <h2 className="text-[18px] font-bold text-cream">Perfil</h2>
          <FormField label="Nombre" {...profileForm.register('display_name')} />
          <div className="flex flex-col gap-1.5">
            <label htmlFor="locale" className="text-[14px] font-medium text-cream">
              Idioma
            </label>
            <select
              id="locale"
              {...profileForm.register('locale')}
              className="h-[45px] rounded-[5px] border border-cream/20 bg-ink-card px-4 text-[15px] text-cream focus:border-gold focus:outline-none"
            >
              <option value="es">Español</option>
              <option value="es-PE">Español (Perú)</option>
              <option value="es-ES">Español (España)</option>
              <option value="en">English</option>
            </select>
          </div>

          {/* Immutable fields (§8.13) */}
          <ReadOnlyRow label="Correo" value={user?.email ?? '—'} />
          <ReadOnlyRow label="Fecha de nacimiento" value={user?.birth_date ?? '—'} />

          {updateAccount.isSuccess && (
            <p className="text-[13px] text-correct">Cambios guardados.</p>
          )}
          <PrimaryButton type="submit" loading={updateAccount.isPending}>
            Guardar cambios
          </PrimaryButton>
        </form>

        {/* Password */}
        <form onSubmit={changePassword} className="flex flex-col gap-4">
          <h2 className="text-[18px] font-bold text-cream">Cambiar contraseña</h2>
          <FormField
            label="Contraseña actual"
            type="password"
            autoComplete="current-password"
            {...passwordForm.register('current_password')}
          />
          <FormField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            {...passwordForm.register('new_password', { minLength: 8 })}
          />
          {pwError && <p className="text-[13px] text-incorrect">{pwError}</p>}
          {setPassword.isSuccess && (
            <p className="text-[13px] text-correct">Contraseña actualizada.</p>
          )}
          <PrimaryButton type="submit" loading={setPassword.isPending}>
            Actualizar contraseña
          </PrimaryButton>
        </form>
      </div>
    </AppShell>
  )
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[14px] font-medium text-cream/70">{label}</span>
      <div className="flex h-[45px] items-center rounded-[5px] border border-cream/10 bg-ink px-4 text-[15px] text-cream/60">
        {value}
      </div>
    </div>
  )
}

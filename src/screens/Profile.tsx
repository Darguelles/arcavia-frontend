import { useRef } from 'react'
import { AppShell } from '../components/AppShell'
import { Avatar } from '../components/Avatar'
import { KeywordHistoryList } from '../components/KeywordHistoryList'
import { LoadingState } from '../components/states'
import { useAccount, useAvatarUpload, useMyAnswers } from '../api/account'
import { useMyProgress } from '../api/gameplay'

/*
 * PERFIL DE USUARIO (/profile) — Figma frame 135:642.
 * Avatar (tap to upload via the two-step S3 flow), points/missions/challenges
 * counts, and the collect-the-words keyword history (spec §8.11).
 */
export function Profile() {
  const { data: user } = useAccount()
  const { data: progress } = useMyProgress()
  const answers = useMyAnswers(50, 0)
  const upload = useAvatarUpload()
  const fileRef = useRef<HTMLInputElement>(null)

  const stats = [
    { label: 'Puntos', value: progress?.total_points ?? 0 },
    { label: 'Misiones', value: progress?.missions_completed ?? 0 },
    { label: 'Desafíos', value: progress?.challenges_completed ?? 0 },
  ]

  return (
    <AppShell back title="Perfil">
      <div className="flex flex-col items-center gap-2 pt-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative rounded-full"
          aria-label="Cambiar foto de perfil"
        >
          <Avatar src={user?.avatar_url} name={user?.display_name} size={96} />
          <span className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full bg-gold text-ink">
            {upload.isPending ? '…' : '📷'}
          </span>
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) upload.mutate(file)
          }}
        />
        <h1 className="mt-2 text-[28px] font-bold text-cream">{user?.display_name}</h1>
        <p className="text-[13px] text-cream/70">{user?.email}</p>
        {upload.isError && (
          <p className="text-[12px] text-incorrect">No se pudo subir la imagen.</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col items-center rounded-[5px] bg-[#f3efe6] py-3">
            <span className="text-[10px] text-ink">{s.label}</span>
            <span className="text-[24px] font-bold text-gold">{s.value}</span>
          </div>
        ))}
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-[18px] font-bold text-cream">Palabras clave</h2>
        {answers.isLoading ? (
          <LoadingState />
        ) : (
          <KeywordHistoryList entries={answers.data?.items ?? []} />
        )}
      </section>
    </AppShell>
  )
}

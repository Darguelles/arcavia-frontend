import { useNavigate } from 'react-router-dom'
import { PrimaryButton } from '../components/PrimaryButton'
import { SecondaryButton } from '../components/SecondaryButton'
import { TermsFooterLink } from '../components/TermsFooterLink'

/*
 * HOME (/) — public marketing page. Figma frame 6:20.
 * NOTE (spec §8.1): several body sections in Figma are Lorem-ipsum placeholders.
 * The copy below uses the REAL Spanish strings present in the frame and omits
 * the placeholder paragraphs — final marketing copy is pending designer/client
 * sign-off before this screen is "done". Structure/layout is faithful.
 */

const HOW_IT_WORKS: { title: string; body: string }[] = [
  { title: 'Registro', body: 'El usuario se registra en la app.' },
  { title: 'Selección', body: 'Elige una ruta urbana.' },
  { title: 'Acción', body: 'Resuelve acertijos en lugares reales.' },
  { title: 'Validación', body: 'Visita patrocinadores para avanzar.' },
  { title: 'Meta', body: 'Consigue palabras clave y resuelve el acertijo final.' },
  { title: 'Competición', body: 'Compite en el ranking de la temporada.' },
]

// Vision section added to the Figma HOME frame (nodes 55:84–55:90) — real copy.
const VISION_POINTS: string[] = [
  'El deseo profundo de vivir las ciudades en lugar de solo visitarlas.',
  'La evolución hacia ciudades mucho más humanas, conectadas y vivas.',
  'El anhelo colectivo de jugar, descubrir y emocionarnos juntos.',
  'La tecnología móvil guiando nuestros pasos hacia historias reales.',
  'El compromiso urgente de devolverle la vida y el corazón a nuestros barrios.',
]

export function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-dvh w-full max-w-[402px] bg-ink text-cream">
      <div className="flex flex-col gap-10 px-[41px] pb-12 pt-16">
        {/* Hero */}
        <header className="flex flex-col gap-6">
          <p className="text-center font-bold uppercase tracking-[0.3em] text-gold">
            Arcavia Quest
          </p>
          <h1 className="text-[32px] font-bold leading-tight">
            Plataforma de
            <br />
            gamificación urbana
          </h1>
          <p className="text-[16px] leading-6 text-cream/90">
            ARCAVIA QUEST es una plataforma de gamificación urbana que conecta turismo y comercio
            local. A través de juegos narrativos y retos, transforma la ciudad en un escenario
            interactivo y cultural.
          </p>
          <div className="flex flex-col gap-3">
            <SecondaryButton onClick={() => navigate('/login')}>Iniciar campaña</SecondaryButton>
            <PrimaryButton onClick={() => navigate('/register')}>Regístrate</PrimaryButton>
          </div>
        </header>

        {/* Necesidad */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[20px] font-bold">Necesidad</h2>
          <p className="text-[16px] leading-6 text-cream/90">
            El turismo urbano actual es pasivo y concentrado, impidiendo que muchos negocios locales
            atraigan clientes. Esto abre la oportunidad de transformar la experiencia urbana uniendo
            exploración, juego y economía local.
          </p>
        </section>

        {/* Solución */}
        <section className="flex flex-col gap-2">
          <h2 className="text-[20px] font-bold">Solución</h2>
          <p className="text-[16px] leading-6 text-cream/90">
            A través de juegos narrativos y retos, transforma la ciudad en un escenario interactivo
            y cultural que impulsa el comercio local.
          </p>
        </section>

        {/* Cómo Funciona */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[20px] font-bold">Cómo Funciona</h2>
          <ol className="flex flex-col gap-4">
            {HOW_IT_WORKS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold text-[14px] font-bold text-black">
                  {i + 1}
                </span>
                <div>
                  <p className="text-[16px] font-semibold">{step.title}</p>
                  <p className="text-[14px] text-cream/80">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Visión — Figma nodes 55:84–55:90 */}
        <section className="flex flex-col gap-4">
          <h2 className="text-[28px] font-bold leading-tight">
            El mundo está listo; nuestro momento es ahora
          </h2>
          <p className="text-[16px] leading-6 text-cream/90">
            Nuestra visión cobra vida gracias a un movimiento global que late con fuerza a través de
            realidades muy claras.
          </p>
          <ul className="flex flex-col gap-3">
            {VISION_POINTS.map((point) => (
              <li key={point} className="flex gap-3">
                <span className="shrink-0 font-bold text-gold">*</span>
                <p className="text-[16px] leading-6 text-cream/90">{point}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Alcance global — Figma node 63:102/63:103 (gold card) */}
        <section className="rounded-[10px] bg-gold px-6 py-8">
          <p className="text-[20px] font-bold leading-snug text-cream">
            ARCAVIA QUEST gamifica ciudades globalmente conectando cultura, tecnología y comercio
            local.
          </p>
        </section>

        {/* Closing */}
        <section className="flex flex-col items-center gap-6 pt-4 text-center">
          <h2 className="text-[28px] font-bold">¡Estás listo!</h2>
          <p className="text-[16px] text-cream/90">Explora y experimenta las ciudades del mundo.</p>
          <div className="flex w-full flex-col gap-3">
            <SecondaryButton onClick={() => navigate('/login')}>Iniciar campaña</SecondaryButton>
            <PrimaryButton onClick={() => navigate('/register')}>Regístrate</PrimaryButton>
          </div>
        </section>

        <TermsFooterLink className="pt-4" />
      </div>
    </div>
  )
}

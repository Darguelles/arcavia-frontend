import { z } from 'zod'

/*
 * Client-side form schemas. These MIRROR server rules for fast feedback, but the
 * server is the source of truth — in particular we never gate on client-side age
 * math (spec §8.2); birth_date is validated only as a real, past calendar date.
 */

export const loginSchema = z.object({
  email: z.string().email('Correo electrónico inválido'),
  password: z.string().min(1, 'Ingresa tu contraseña'),
})
export type LoginForm = z.infer<typeof loginSchema>

export const registerSchema = z.object({
  display_name: z.string().min(2, 'Ingresa tu nombre'),
  email: z.string().email('Correo electrónico inválido'),
  birth_date: z
    .string()
    .min(1, 'Ingresa tu fecha de nacimiento')
    .refine((v) => {
      const d = new Date(v)
      return !Number.isNaN(d.getTime()) && d < new Date()
    }, 'Fecha inválida'),
  password: z.string().min(8, 'Mínimo 8 caracteres'),
  consent: z.literal(true, {
    // consent is required — POST /auth/register rejects without it (§8.2/§11)
    message: 'Debes aceptar los términos y condiciones',
  }),
})
export type RegisterForm = z.infer<typeof registerSchema>

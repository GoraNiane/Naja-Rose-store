import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    firstName: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
    lastName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    phone: z.string().min(9, 'Numéro de téléphone invalide (ex: +221770000000)'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Adresse email invalide'),
    password: z.string().min(1, 'Le mot de passe est requis'),
  }),
});

export const adminLoginSchema = z.object({
  body: z.object({
    password: z.string().min(1, 'Le mot de passe administrateur est requis'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];

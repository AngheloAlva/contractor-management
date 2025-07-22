import { z } from "zod"

import { rutRegex } from "@/shared/schemas/rutRegex"

export const updatePartnerUsersSchema = z.object({
	name: z.string().min(2, { message: "El nombre debe tener al menos 2 caracteres" }),
	email: z.string().email({ message: "El correo electrónico debe ser válido" }),
	phone: z.string().optional(),
	rut: z.string().regex(rutRegex, { message: "El RUT no es válido" }),
	internalRole: z.string().optional(),
	internalArea: z.string().optional(),
	isSupervisor: z.boolean().optional(),
})

export type UpdatePartnerUsersSchema = z.infer<typeof updatePartnerUsersSchema>

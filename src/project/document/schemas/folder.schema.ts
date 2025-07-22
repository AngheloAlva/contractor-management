import { DocumentAreasValuesArray } from "@/lib/consts/areas"
import { z } from "zod"

export const folderFormSchema = z.object({
	userId: z.string(),

	root: z.boolean(),
	name: z
		.string({ message: "El nombre es requerido" })
		.min(2, "El nombre debe tener al menos 2 caracteres"),
	description: z.string().optional(),
	area: z.enum(DocumentAreasValuesArray, { message: "El área es requerida" }),
	type: z.string().optional(),

	parentFolderId: z.string().optional(),
})

export type FolderFormSchema = z.infer<typeof folderFormSchema>

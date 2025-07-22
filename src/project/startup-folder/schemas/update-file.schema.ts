import { z } from "zod"

import { fileSchema } from "@/shared/schemas/file.schema"
import {
	WorkerDocumentType,
	EnvironmentDocType,
	VehicleDocumentType,
	SafetyAndHealthDocumentType,
} from "@prisma/client"

export const updateStartupFolderDocumentSchema = z.object({
	documentId: z.string(),
	file: z.array(fileSchema).min(1, { message: "Se requiere subir un archivo" }),
	expirationDate: z.date({ message: "La fecha de vencimiento es requerida" }),
	documentName: z.string().optional(),
	documentType: z
		.nativeEnum({
			...WorkerDocumentType,
			...EnvironmentDocType,
			...VehicleDocumentType,
			...SafetyAndHealthDocumentType,
		})
		.optional(),
})

export type UpdateStartupFolderDocumentSchema = z.infer<typeof updateStartupFolderDocumentSchema>

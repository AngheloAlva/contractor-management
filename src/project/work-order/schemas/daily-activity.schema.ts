import { z } from "zod"

import { fileSchema } from "../../../shared/schemas/file.schema"

export const dailyActivitySchema = z.object({
	workOrderId: z.string(),
	milestoneId: z.string(),

	comments: z.string().optional(),
	executionDate: z.date({ message: "La fecha de ejecución no es válida" }),
	activityStartTime: z.string().nonempty({ message: "La hora de inicio no puede estar vacía" }),
	activityEndTime: z.string().nonempty({ message: "La hora de fin no puede estar vacía" }),
	activityName: z.string().nonempty({ message: "El nombre de la actividad no puede estar vacío" }),
	personnel: z
		.array(
			z.object({
				userId: z.string().nonempty({ message: "El ID del personal no puede estar vacío" }),
			})
		)
		.min(1, { message: "Debe haber al menos un personal" }),
	files: z.array(fileSchema).optional(),
})

export type DailyActivitySchema = z.infer<typeof dailyActivitySchema>

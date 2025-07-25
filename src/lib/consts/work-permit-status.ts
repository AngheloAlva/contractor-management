export const WORK_PERMIT_STATUS_VALUES = {
	ACTIVE: "ACTIVE",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
	CANCELLED: "CANCELLED",
	EXPIRED: "EXPIRED",
	REVIEW_PENDING: "REVIEW_PENDING",
} as const

export const WORK_PERMIT_STATUS_VALUES_ARRAY = [
	WORK_PERMIT_STATUS_VALUES.ACTIVE,
	WORK_PERMIT_STATUS_VALUES.IN_PROGRESS,
	WORK_PERMIT_STATUS_VALUES.COMPLETED,
	WORK_PERMIT_STATUS_VALUES.CANCELLED,
	WORK_PERMIT_STATUS_VALUES.EXPIRED,
	WORK_PERMIT_STATUS_VALUES.REVIEW_PENDING,
] as const

export type WorkPermitStatus = keyof typeof WORK_PERMIT_STATUS_VALUES

export const WorkPermitStatusLabels = {
	[WORK_PERMIT_STATUS_VALUES.ACTIVE]: "Activo",
	[WORK_PERMIT_STATUS_VALUES.IN_PROGRESS]: "En Proceso",
	[WORK_PERMIT_STATUS_VALUES.COMPLETED]: "Completado",
	[WORK_PERMIT_STATUS_VALUES.CANCELLED]: "Cancelado",
	[WORK_PERMIT_STATUS_VALUES.EXPIRED]: "Expirado",
	[WORK_PERMIT_STATUS_VALUES.REVIEW_PENDING]: "Pendiente de Aprobación",
}

export const WorkPermitStatusOptions = [
	{
		value: WORK_PERMIT_STATUS_VALUES.ACTIVE,
		label: "Activo",
	},
	{
		value: WORK_PERMIT_STATUS_VALUES.IN_PROGRESS,
		label: "En Proceso",
	},
	{
		value: WORK_PERMIT_STATUS_VALUES.COMPLETED,
		label: "Completado",
	},
	{
		value: WORK_PERMIT_STATUS_VALUES.CANCELLED,
		label: "Cancelado",
	},
	{
		value: WORK_PERMIT_STATUS_VALUES.EXPIRED,
		label: "Expirado",
	},
	{
		value: WORK_PERMIT_STATUS_VALUES.REVIEW_PENDING,
		label: "Pendiente de Aprobación",
	},
]

export const WORK_ORDER_STATUS_VALUES = {
	PLANNED: "PLANNED",
	PENDING: "PENDING",
	COMPLETED: "COMPLETED",
	CANCELLED: "CANCELLED",
	IN_PROGRESS: "IN_PROGRESS",
	CLOSURE_REQUESTED: "CLOSURE_REQUESTED",
} as const

export const WORK_ORDER_STATUS_VALUES_ARRAY = [
	WORK_ORDER_STATUS_VALUES.PENDING,
	WORK_ORDER_STATUS_VALUES.IN_PROGRESS,
	WORK_ORDER_STATUS_VALUES.COMPLETED,
	WORK_ORDER_STATUS_VALUES.CANCELLED,
	WORK_ORDER_STATUS_VALUES.CLOSURE_REQUESTED,
	WORK_ORDER_STATUS_VALUES.PLANNED,
] as const

export const WorkOrderStatusLabels = {
	PENDING: "Pendiente",
	IN_PROGRESS: "En Proceso",
	COMPLETED: "Completado",
	CANCELLED: "Cancelado",
	EXPIRED: "Expirado",
	CLOSURE_REQUESTED: "Cierre Solicitado",
	PLANNED: "Planificado",
}

export const WorkOrderStatusOptions = [
	{
		value: WORK_ORDER_STATUS_VALUES.IN_PROGRESS,
		label: "En Proceso",
	},
	{
		value: WORK_ORDER_STATUS_VALUES.COMPLETED,
		label: "Completado",
	},
	{
		value: WORK_ORDER_STATUS_VALUES.CLOSURE_REQUESTED,
		label: "Cierre Solicitado",
	},
	{
		value: WORK_ORDER_STATUS_VALUES.PLANNED,
		label: "Planificado",
	},
]

export const WorkOrderStatusSimpleOptions = [
	{
		value: WORK_ORDER_STATUS_VALUES.PENDING,
		label: "Pendiente",
	},
	{
		value: WORK_ORDER_STATUS_VALUES.IN_PROGRESS,
		label: "En Proceso",
	},
	{
		value: WORK_ORDER_STATUS_VALUES.PLANNED,
		label: "Planificado",
	},
]

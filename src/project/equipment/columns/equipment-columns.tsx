"use client"

import { ColumnDef } from "@tanstack/react-table"
import { EyeIcon } from "lucide-react"
import Link from "next/link"

import { cn } from "@/lib/utils"

import EquipmentDetailsDialog from "@/project/equipment/components/dialogs/EquipmentDetailsDialog"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"

import type { WorkEquipment } from "@/project/equipment/hooks/use-equipments"

export const EquipmentColumns: ColumnDef<WorkEquipment>[] = [
	{
		accessorKey: "id",
		cell: ({ row }) => {
			const equipment = row.original
			return (
				<EquipmentDetailsDialog equipment={equipment}>
					<Button
						size={"icon"}
						variant={"ghost"}
						className="size-8 cursor-pointer text-left font-medium text-teal-600 hover:bg-teal-600 hover:text-white"
					>
						<EyeIcon className="size-4" />
					</Button>
				</EquipmentDetailsDialog>
			)
		},
	},
	{
		accessorKey: "tag",
		header: "TAG",
	},
	{
		accessorKey: "name",
		header: "Nombre del Equipo",
	},
	{
		accessorKey: "type",
		header: "Tipo de Equipo",
		cell: ({ row }) => {
			const type = row.getValue("type") as string | null
			return <span>{type || "N/A"}</span>
		},
	},
	{
		accessorKey: "location",
		header: "Ubicación del Equipo",
	},
	{
		accessorKey: "description",
		header: "Descripción",
	},
	{
		accessorKey: "isOperational",
		header: "¿Operacional?",
		cell: ({ row }) => {
			const isOperational = row.getValue("isOperational") as boolean
			return (
				<Badge
					variant={"outline"}
					className={cn("border-emerald-500 bg-emerald-500/10 text-emerald-500", {
						"border-red-500 bg-red-500/10 text-red-500": !isOperational,
					})}
				>
					{isOperational ? "Sí" : "No"}
				</Badge>
			)
		},
	},
	{
		id: "childrenCount",
		header: "Equipos Hijos",
		cell: ({ row }) => {
			const count = (row.original._count as { children: number }).children
			return <span>{count}</span>
		},
	},
	{
		id: "workOrdersCount",
		header: "OTs Asignadas",
		cell: ({ row }) => {
			const count = (row.original._count as { workOrders: number }).workOrders
			return <span>{count}</span>
		},
	},
	{
		id: "attachmentsCount",
		header: "Archivos",
		cell: ({ row }) => {
			const attachments = row.original.attachments

			return (
				<ul className="flex flex-col gap-1">
					{attachments.length > 0 ? (
						attachments.map((attachment) => (
							<li key={attachment.id}>
								<Link
									target="_blank"
									href={attachment.url}
									rel="noopener noreferrer"
									className="text-green-500 hover:underline"
								>
									{attachment.name}
								</Link>
							</li>
						))
					) : (
						<li>Sin archivos</li>
					)}
				</ul>
			)
		},
	},
]

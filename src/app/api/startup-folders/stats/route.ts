import { NextResponse } from "next/server"
import { headers } from "next/headers"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(): Promise<NextResponse> {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id) {
		return new NextResponse("No autorizado", { status: 401 })
	}

	try {
		const [totalFolders, totalFoldersToReview, totalFoldersActive, totalCompaniesApproved] =
			await Promise.all([
				prisma.startupFolder.count(),
				prisma.startupFolder.count({
					where: {
						OR: [
							{ workersFolders: { some: { documents: { some: { status: "SUBMITTED" } } } } },
							{ vehiclesFolders: { some: { documents: { some: { status: "SUBMITTED" } } } } },
							{ environmentFolders: { some: { documents: { some: { status: "SUBMITTED" } } } } },
							{ techSpecsFolders: { some: { documents: { some: { status: "SUBMITTED" } } } } },
							{ basicFolders: { some: { documents: { some: { status: "SUBMITTED" } } } } },
							{
								safetyAndHealthFolders: { some: { documents: { some: { status: "SUBMITTED" } } } },
							},
						],
					},
				}),
				prisma.startupFolder.count({
					where: {
						company: {
							workOrders: {
								some: {
									status: { in: ["IN_PROGRESS", "PENDING", "PLANNED"] },
								},
							},
						},
					},
				}),
				prisma.company.count({
					where: {
						StartupFolders: {
							some: {
								AND: [
									{ environmentFolders: { every: { status: "APPROVED" } } },
									{ techSpecsFolders: { every: { status: "APPROVED" } } },
									{ basicFolders: { every: { status: "APPROVED" } } },
									{ workersFolders: { every: { status: "APPROVED" } } },
									{ safetyAndHealthFolders: { every: { status: "APPROVED" } } },
									{ vehiclesFolders: { every: { status: "APPROVED" } } },
								],
							},
						},
					},
				}),
			])

		const [safetyDocs, environmentalDocs, workerDocs, vehicleDocs, techSpecsDocs, basicDocs] =
			await Promise.all([
				prisma.safetyAndHealthDocument.groupBy({
					by: ["status"],
					_count: { id: true },
				}),
				prisma.environmentDocument.groupBy({
					by: ["status"],
					_count: { id: true },
				}),
				prisma.workerDocument.groupBy({
					by: ["status"],
					_count: { id: true },
				}),
				prisma.vehicleDocument.groupBy({
					by: ["status"],
					_count: { id: true },
				}),
				prisma.techSpecsDocument.groupBy({
					by: ["status"],
					_count: { id: true },
				}),
				prisma.basicDocument.groupBy({
					by: ["status"],
					_count: { id: true },
				}),
			])

		// Datos para el gráfico circular (total por estado)
		const documentsByStatus = ["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"].map((status) => {
			const safetyCount = safetyDocs.find((d) => d.status === status)?._count.id ?? 0
			const environmentCount = environmentalDocs.find((d) => d.status === status)?._count.id ?? 0
			const workerCount = workerDocs.find((d) => d.status === status)?._count.id ?? 0
			const vehicleCount = vehicleDocs.find((d) => d.status === status)?._count.id ?? 0
			const techSpecsCount = techSpecsDocs.find((d) => d.status === status)?._count.id ?? 0
			const basicCount = basicDocs.find((d) => d.status === status)?._count.id ?? 0

			return {
				status,
				count:
					safetyCount + environmentCount + workerCount + vehicleCount + techSpecsCount + basicCount,
			}
		})

		// Datos para el gráfico de barras apiladas
		const documentsByFolder = [
			{
				name: "Seguridad y Salud",
				data: safetyDocs.map((doc) => ({
					status: doc.status,
					count: doc._count.id,
				})),
			},
			{
				name: "Medio Ambiente",
				data: environmentalDocs.map((doc) => ({
					status: doc.status,
					count: doc._count.id,
				})),
			},
			{
				name: "Especificaciones Técnicas",
				data: techSpecsDocs.map((doc) => ({
					status: doc.status,
					count: doc._count.id,
				})),
			},
			{
				name: "Trabajadores",
				data: workerDocs.map((doc) => ({
					status: doc.status,
					count: doc._count.id,
				})),
			},
			{
				name: "Vehículos",
				data: vehicleDocs.map((doc) => ({
					status: doc.status,
					count: doc._count.id,
				})),
			},
			{
				name: "Documentos Básicos",
				data: basicDocs.map((doc) => ({
					status: doc.status,
					count: doc._count.id,
				})),
			},
		]

		return NextResponse.json({
			// Estadísticas básicas
			totalFolders,
			totalFoldersActive,
			totalFoldersToReview,
			totalCompaniesApproved,
			// Datos para gráficas
			charts: {
				documentsByStatus,
				documentsByFolder,
			},
		})
	} catch (error) {
		console.error("[STARTUP_FOLDERS_STATS_ERROR]", error)
		return new NextResponse("Error interno del servidor", { status: 500 })
	}
}

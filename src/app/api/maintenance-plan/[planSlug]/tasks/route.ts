import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { PLAN_FREQUENCY } from "@prisma/client"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ planSlug: string }> }
): Promise<NextResponse> {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id) {
		return new NextResponse("No autorizado", { status: 401 })
	}

	const { planSlug } = await params
	const searchParams = req.nextUrl.searchParams
	const limit = parseInt(searchParams.get("limit") ?? "10")
	const page = parseInt(searchParams.get("page") ?? "1")
	const search = searchParams.get("search") ?? ""
	const frequency = searchParams.get("frequency") ?? ""
	const nextDateFrom = searchParams.get("nextDateFrom") ?? ""
	const nextDateTo = searchParams.get("nextDateTo") ?? ""

	const skip = (page - 1) * limit

	try {
		const maintenancePlan = await prisma.maintenancePlan.findFirst({
			where: {
				slug: planSlug,
			},
			select: {
				id: true,
			},
		})

		if (!maintenancePlan) {
			return NextResponse.json({
				message: "Plan de mantenimiento no encontrado",
				status: 404,
			})
		}

		const [tasks, total] = await Promise.all([
			await prisma.maintenancePlanTask.findMany({
				where: {
					maintenancePlanId: maintenancePlan.id,
					...(search
						? {
								OR: [
									{ name: { contains: search, mode: "insensitive" } },
									{ description: { contains: search, mode: "insensitive" } },
									{ equipment: { name: { contains: search, mode: "insensitive" } } },
								],
							}
						: {}),
					...(frequency ? { frequency: frequency as PLAN_FREQUENCY } : {}),
					...(nextDateFrom ? { nextDate: { gte: new Date(nextDateFrom) } } : {}),
					...(nextDateTo
						? {
								nextDate: {
									...(nextDateFrom ? { gte: new Date(nextDateFrom) } : {}),
									lte: new Date(nextDateTo),
								},
							}
						: {}),
				},
				select: {
					id: true,
					name: true,
					slug: true,
					nextDate: true,
					createdAt: true,
					description: true,
					frequency: true,
					equipment: {
						select: {
							id: true,
							tag: true,
							name: true,
							location: true,
						},
					},
					createdBy: {
						select: {
							id: true,
							name: true,
						},
					},
					attachments: {
						select: {
							id: true,
							name: true,
							url: true,
						},
					},
					_count: {
						select: {
							workOrders: true,
						},
					},
				},
				skip,
				take: limit,
				orderBy: {
					nextDate: "asc",
				},
			}),
			await prisma.maintenancePlanTask.count({
				where: {
					maintenancePlanId: maintenancePlan.id,
					...(search
						? {
								OR: [
									{ name: { contains: search, mode: "insensitive" } },
									{ description: { contains: search, mode: "insensitive" } },
									{ equipment: { name: { contains: search, mode: "insensitive" } } },
								],
							}
						: {}),
					...(frequency ? { frequency: frequency as PLAN_FREQUENCY } : {}),
					...(nextDateFrom ? { nextDate: { gte: new Date(nextDateFrom) } } : {}),
					...(nextDateTo
						? {
								nextDate: {
									...(nextDateFrom ? { gte: new Date(nextDateFrom) } : {}),
									lte: new Date(nextDateTo),
								},
							}
						: {}),
				},
			}),
		])

		return NextResponse.json({
			tasks,
			total,
			pages: Math.ceil(total / limit),
		})
	} catch (error) {
		console.error("[MAINTENANCE_PLAN_TASKS_GET]", error)
		return NextResponse.json({
			message: "Internal Error",
			status: 500,
		})
	}
}

import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"
import { subDays } from "date-fns"

import { type WORK_ORDER_PRIORITY, WORK_ORDER_STATUS, type WORK_ORDER_TYPE } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

import type { Order, OrderBy } from "@/shared/components/OrderByButton"

export async function GET(req: NextRequest): Promise<NextResponse> {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id) {
		return new NextResponse("No autorizado", { status: 401 })
	}

	try {
		const searchParams = req.nextUrl.searchParams
		const page = parseInt(searchParams.get("page") || "1")
		const limit = parseInt(searchParams.get("limit") || "10")
		const search = searchParams.get("search") || ""
		const typeFilter = searchParams.get("typeFilter") || null
		const statusFilter = searchParams.get("statusFilter") || null
		const priorityFilter = searchParams.get("priorityFilter") || null
		const companyId = searchParams.get("companyId") || null
		const startDate = searchParams.get("startDate") || null
		const endDate = searchParams.get("endDate") || null
		const permitFilter = searchParams.get("permitFilter") === "true"
		const order = searchParams.get("order") as Order
		const orderBy = searchParams.get("orderBy") as OrderBy
		const isOtcMember = searchParams.get("isOtcMember") === "true"

		let orderByField: string

		if (orderBy === "name") {
			orderByField = "workName"
		} else {
			orderByField = "createdAt"
		}

		const skip = (page - 1) * limit

		const filter = {
			...(search
				? {
						OR: [
							{ workName: { contains: search, mode: "insensitive" as const } },
							{ workLocation: { contains: search, mode: "insensitive" as const } },
							{ otNumber: { contains: search, mode: "insensitive" as const } },
						],
					}
				: {}),
			...(statusFilter
				? { status: statusFilter as WORK_ORDER_STATUS }
				: permitFilter
					? { status: { in: [WORK_ORDER_STATUS.PLANNED, WORK_ORDER_STATUS.IN_PROGRESS] } }
					: {}),
			...(priorityFilter
				? {
						priority: priorityFilter as WORK_ORDER_PRIORITY,
					}
				: {}),
			...(permitFilter
				? {
						estimatedEndDate: { gte: subDays(new Date(), 1) },
					}
				: {}),
			...(typeFilter
				? {
						type: typeFilter as WORK_ORDER_TYPE,
					}
				: {}),
			...(companyId
				? {
						companyId: companyId,
					}
				: {}),
			...(isOtcMember
				? {
						companyId: process.env.NEXT_PUBLIC_OTC_COMPANY_ID!,
					}
				: {}),
			...(startDate || endDate
				? {
						solicitationDate: {
							...(startDate ? { gte: new Date(startDate) } : {}),
							...(endDate ? { lte: new Date(endDate) } : {}),
						},
					}
				: {}),
		}

		const [workOrders, total, stats] = await Promise.all([
			prisma.workOrder.findMany({
				where: filter,
				select: {
					id: true,
					otNumber: true,
					solicitationDate: true,
					type: true,
					status: true,
					capex: true,
					solicitationTime: true,
					workRequest: true,
					workDescription: true,
					workProgressStatus: true,
					priority: true,
					createdAt: true,
					initReport: {
						select: {
							url: true,
						},
					},
					endReport: true,
					programDate: true,
					estimatedHours: true,
					estimatedDays: true,
					estimatedEndDate: true,
					equipment: {
						select: {
							id: true,
							name: true,
						},
					},
					company: {
						select: {
							id: true,
							name: true,
							rut: true,
						},
					},
					supervisor: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					responsible: {
						select: {
							id: true,
							name: true,
							email: true,
							role: true,
						},
					},
					_count: {
						select: {
							workEntries: {
								where: {
									entryType: { in: ["ADDITIONAL_ACTIVITY", "DAILY_ACTIVITY"] },
								},
							},
						},
					},
				},
				skip,
				take: limit,
				orderBy: {
					[orderByField]: order,
				},
			}),
			prisma.workOrder.count({
				where: filter,
			}),
			prisma.$transaction([
				prisma.workOrder.count({
					where: {
						status: { in: ["IN_PROGRESS", "PENDING"] },
					},
				}),
				prisma.workOrder.count({
					where: {
						status: "COMPLETED",
					},
				}),
				prisma.workOrder.aggregate({
					_avg: {
						workProgressStatus: true,
					},
				}),
			]),
		])

		const [activeCount, completedCount, totalEntries] = stats

		return NextResponse.json({
			workOrders,
			total,
			pages: Math.ceil(total / limit),
			stats: {
				activeCount,
				completedCount,
				totalEntries,
			},
		})
	} catch (error) {
		console.error("[WORK_BOOKS_GET]", error)
		return NextResponse.json({ error: "Error fetching work books" }, { status: 500 })
	}
}

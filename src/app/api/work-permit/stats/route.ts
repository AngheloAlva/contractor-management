import { NextResponse } from "next/server"
import { headers } from "next/headers"

import prisma from "@/lib/prisma"
import { auth } from "@/lib/auth"

export const dynamic = "force-dynamic"

export async function GET(): Promise<NextResponse> {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id) {
		return new NextResponse("No autorizado", { status: 401 })
	}

	try {
		// 1. Total count of work permits
		const totalWorkPermits = await prisma.workPermit.count({})

		// 2. Work permits by status
		const workPermitsByStatus = await prisma.workPermit.groupBy({
			by: ["status"],
			_count: {
				id: true,
			},
		})

		// 3. Work permits by type of work
		const workPermitsByType = await prisma.workPermit.groupBy({
			by: ["workWillBe"],
			_count: {
				id: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
			take: 5, // Top 5 types
		})

		// 4. Active work permits by company
		const activeWorkPermitsByCompany = await prisma.workPermit.groupBy({
			by: ["companyId"],
			where: {
				status: "ACTIVE",
			},
			_count: {
				id: true,
			},
			orderBy: {
				_count: {
					id: "desc",
				},
			},
			take: 5,
		})

		// 5. Work permits activity over time (last 30 days)
		const thirtyDaysAgo = new Date()
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

		const workPermitActivity = await prisma.workPermit.findMany({
			where: {
				createdAt: {
					gte: thirtyDaysAgo,
				},
			},
			select: {
				id: true,
				status: true,
				createdAt: true,
				company: {
					select: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: "asc",
			},
		})

		// Process activity data by day
		const activityByDay: Record<string, { date: string; count: number }> = {}
		workPermitActivity.forEach((activity) => {
			const date = activity.createdAt.toISOString().split("T")[0]
			if (!activityByDay[date]) {
				activityByDay[date] = { date, count: 0 }
			}
			activityByDay[date].count++
		})

		// Get company details for active permits
		const companyDetails = await prisma.company.findMany({
			where: {
				id: {
					in: activeWorkPermitsByCompany.map((wp) => wp.companyId),
				},
			},
			select: {
				id: true,
				name: true,
			},
		})

		return NextResponse.json({
			totalWorkPermits,
			workPermitsByStatus: workPermitsByStatus.map((item) => ({
				status: item.status,
				count: item._count.id,
				fill: getStatusColor(item.status),
			})),
			workPermitsByType: workPermitsByType.map((item) => ({
				type: item.workWillBe || "Otro",
				count: item._count.id,
			})),
			activeWorkPermitsByCompany: activeWorkPermitsByCompany.map((item) => ({
				companyId: item.companyId,
				companyName: companyDetails.find((c) => c.id === item.companyId)?.name || "Unknown",
				count: item._count.id,
			})),
			activityData: Object.values(activityByDay),
		})
	} catch (error) {
		console.error("[WORK_PERMIT_STATS]", error)
		return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
	}
}

function getStatusColor(status: string): string {
	switch (status) {
		case "ACTIVE":
			return "var(--color-pink-500)"
		case "IN_PROGRESS":
			return "var(--color-rose-500)"
		case "COMPLETED":
			return "var(--color-red-500)"
		case "CANCELLED":
			return "var(--color-violet-500)"
		case "EXPIRED":
			return "var(--color-fuchsia-500)"
		default:
			return "var(--color-purple-500)"
	}
}

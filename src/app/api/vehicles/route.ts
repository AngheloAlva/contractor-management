import { NextRequest, NextResponse } from "next/server"
import { headers } from "next/headers"

import { Prisma, VEHICLE_TYPE } from "@prisma/client"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function GET(req: NextRequest): Promise<NextResponse> {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user?.id) {
		return new NextResponse("No autorizado", { status: 401 })
	}

	try {
		if (!session?.user?.companyId) {
			return NextResponse.json(
				{
					message: "No tienes permisos para ver vehículos",
				},
				{
					status: 401,
				}
			)
		}

		const searchParams = req.nextUrl.searchParams
		const page = Number(searchParams.get("page") || "1")
		const limit = Number(searchParams.get("limit") || "10")
		const search = searchParams.get("search") || ""
		const typeFilter = searchParams.get("typeFilter") || null

		const skip = (page - 1) * limit

		const whereClause: Prisma.VehicleWhereInput = {
			isActive: true,
			companyId: session.user.companyId,
		}

		if (search) {
			whereClause.OR = [
				{ plate: { contains: search, mode: "insensitive" } },
				{ model: { contains: search, mode: "insensitive" } },
				{ brand: { contains: search, mode: "insensitive" } },
			]
		}

		if (typeFilter) {
			whereClause.type = typeFilter as VEHICLE_TYPE
		}

		const [vehicles, total] = await Promise.all([
			prisma.vehicle.findMany({
				where: whereClause,
				orderBy: {
					updatedAt: "desc",
				},
				skip,
				take: limit,
				select: {
					id: true,
					plate: true,
					model: true,
					year: true,
					brand: true,
					type: true,
					color: true,
					isMain: true,
					createdAt: true,
					updatedAt: true,
					companyId: true,
					company: {
						select: {
							name: true,
						},
					},
				},
			}),
			prisma.vehicle.count({
				where: whereClause,
			}),
		])

		const pages = Math.ceil(total / limit)

		return NextResponse.json({
			vehicles,
			total,
			pages,
			page,
			limit,
		})
	} catch (error) {
		console.error("Error al obtener vehículos:", error)
		return NextResponse.json(
			{
				message: "Error al obtener vehículos",
			},
			{
				status: 500,
			}
		)
	}
}

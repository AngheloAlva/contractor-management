/* eslint-disable @typescript-eslint/no-explicit-any */
"use server"

import { headers } from "next/headers"

import { DocumentCategory, type Prisma, ReviewStatus, MODULES, ACTIVITY_TYPE } from "@prisma/client"
import { sendReviewNotificationEmail } from "./emails/send-review-notification-email"
import { BASIC_FOLDER_STRUCTURE } from "@/lib/consts/basic-startup-folders-structure"
import { VEHICLE_STRUCTURE } from "@/lib/consts/vehicle-folder-structure"
import { logActivity } from "@/lib/activity/log"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import {
	BASE_WORKER_STRUCTURE,
	DRIVER_WORKER_STRUCTURE,
} from "@/lib/consts/worker-folder-structure"
import {
	TECH_SPEC_STRUCTURE,
	ENVIRONMENT_STRUCTURE,
	SAFETY_AND_HEALTH_STRUCTURE,
	EXTENDED_ENVIRONMENT_STRUCTURE,
} from "@/lib/consts/startup-folders-structure"

interface AddDocumentReviewProps {
	comments: string
	documentId: string
	reviewerId: string
	startupFolderId: string
	category: DocumentCategory
	status: "APPROVED" | "REJECTED"
}

export const addDocumentReview = async ({
	status,
	category,
	comments,
	documentId,
	reviewerId,
	startupFolderId,
}: AddDocumentReviewProps): Promise<{ ok: boolean; message: string }> => {
	const session = await auth.api.getSession({
		headers: await headers(),
	})

	if (!session?.user) {
		return {
			ok: false,
			message: "No se encontro usuario",
		}
	}

	try {
		const newStatus =
			status === ReviewStatus.APPROVED ? ReviewStatus.APPROVED : ReviewStatus.REJECTED

		logActivity({
			userId: reviewerId,
			module: MODULES.STARTUP_FOLDERS,
			action: newStatus === ReviewStatus.APPROVED ? ACTIVITY_TYPE.APPROVE : ACTIVITY_TYPE.REJECT,
			entityId: documentId,
			entityType: "StartupFolderDocument",
			metadata: {
				category,
				comments,
				startupFolderId,
			},
		})

		let document: Document
		let totalDocuments: number
		let allDocuments: AllDocuments | null
		let totalReviewedDocuments: number

		const now: Date = new Date()

		switch (category) {
			case DocumentCategory.SAFETY_AND_HEALTH:
				document = await prisma.safetyAndHealthDocument.update({
					where: { id: documentId },
					data: {
						status: newStatus,
						reviewNotes: comments,
						reviewedAt: now,
						reviewer: {
							connect: {
								id: reviewerId,
							},
						},
					},
					include: {
						uploadedBy: true,
					},
				})

				allDocuments = await prisma.safetyAndHealthFolder.findUnique({
					where: {
						startupFolderId,
					},
					select: {
						id: true,
						documents: {
							select: {
								name: true,
								status: true,
								reviewNotes: true,
							},
						},
						additionalNotificationEmails: true,
						startupFolder: {
							select: {
								name: true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				})

				totalDocuments = SAFETY_AND_HEALTH_STRUCTURE.documents.length

				if (
					allDocuments?.documents.every((d) => d.status === ReviewStatus.APPROVED) &&
					allDocuments.documents.length === totalDocuments
				) {
					await prisma.safetyAndHealthFolder.update({
						where: { startupFolderId },
						data: {
							status: ReviewStatus.APPROVED,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: true,
							reviewDate: new Date(),
							emails: allDocuments.additionalNotificationEmails,
							companyName: allDocuments?.startupFolder.company.name,
							folderName: allDocuments.startupFolder.name + " - Seguridad y Salud Ocupacional",
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente ",
					}
				}

				totalReviewedDocuments =
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.APPROVED).length || 0) +
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.REJECTED).length || 0)

				if (
					totalReviewedDocuments <= totalDocuments &&
					allDocuments?.documents.every((d) => d.status !== ReviewStatus.SUBMITTED)
				) {
					await prisma.safetyAndHealthFolder.update({
						where: { startupFolderId },
						data: {
							status: ReviewStatus.DRAFT,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName: allDocuments.startupFolder.name + " - Seguridad y Salud Ocupacional",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}
				break
			case DocumentCategory.ENVIRONMENT:
				document = await prisma.environmentDocument.update({
					where: { id: documentId },
					data: {
						status: newStatus,
						reviewNotes: comments,
						reviewedAt: now,
						reviewer: {
							connect: {
								id: reviewerId,
							},
						},
					},
					include: {
						uploadedBy: true,
					},
				})

				allDocuments = await prisma.environmentFolder.findUnique({
					where: {
						startupFolderId,
					},
					select: {
						id: true,
						documents: {
							select: {
								name: true,
								status: true,
								reviewNotes: true,
							},
						},
						additionalNotificationEmails: true,
						startupFolder: {
							select: {
								name: true,
								moreMonthDuration: true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				})

				totalDocuments = (allDocuments?.startupFolder as { moreMonthDuration: boolean })
					.moreMonthDuration
					? EXTENDED_ENVIRONMENT_STRUCTURE.documents.length + 1
					: ENVIRONMENT_STRUCTURE.documents.length

				if (
					allDocuments?.documents.every((d) => d.status === ReviewStatus.APPROVED) &&
					allDocuments.documents.length === totalDocuments
				) {
					await prisma.environmentFolder.update({
						where: { startupFolderId },
						data: {
							status: ReviewStatus.APPROVED,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName: allDocuments.startupFolder.name + " - Medio Ambiente",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				totalReviewedDocuments =
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.APPROVED).length || 0) +
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.REJECTED).length || 0)

				if (
					totalReviewedDocuments <= totalDocuments &&
					allDocuments?.documents.every((d) => d.status !== ReviewStatus.SUBMITTED)
				) {
					await prisma.environmentFolder.update({
						where: { startupFolderId },
						data: {
							status: ReviewStatus.DRAFT,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName: allDocuments.startupFolder.name + " - Medio Ambiente",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				break
			case DocumentCategory.TECHNICAL_SPECS:
				document = await prisma.techSpecsDocument.update({
					where: { id: documentId },
					data: {
						status: newStatus,
						reviewNotes: comments,
						reviewedAt: now,
						reviewer: {
							connect: {
								id: reviewerId,
							},
						},
					},
					include: {
						uploadedBy: true,
					},
				})

				allDocuments = await prisma.techSpecsFolder.findUnique({
					where: {
						startupFolderId,
					},
					select: {
						id: true,
						documents: {
							select: {
								name: true,
								status: true,
								reviewNotes: true,
							},
						},
						additionalNotificationEmails: true,
						startupFolder: {
							select: {
								name: true,
								moreMonthDuration: true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				})

				totalDocuments = TECH_SPEC_STRUCTURE.documents.length

				if (
					allDocuments?.documents.every((d) => d.status === ReviewStatus.APPROVED) &&
					allDocuments.documents.length === totalDocuments
				) {
					await prisma.techSpecsFolder.update({
						where: { startupFolderId },
						data: {
							status: ReviewStatus.APPROVED,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName: allDocuments.startupFolder.name + " - Especificaciones Técnicas",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				totalReviewedDocuments =
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.APPROVED).length || 0) +
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.REJECTED).length || 0)

				if (
					totalReviewedDocuments <= totalDocuments &&
					allDocuments?.documents.every((d) => d.status !== ReviewStatus.SUBMITTED)
				) {
					await prisma.techSpecsFolder.update({
						where: { startupFolderId },
						data: {
							status: ReviewStatus.DRAFT,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName: allDocuments.startupFolder.name + " - Especificaciones Técnicas",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				break
			case DocumentCategory.PERSONNEL:
				document = await prisma.workerDocument.update({
					where: { id: documentId },
					data: {
						reviewNotes: comments,
						reviewedAt: now,
						status: newStatus,
						reviewer: {
							connect: {
								id: reviewerId,
							},
						},
					},
					select: {
						folder: {
							select: {
								workerId: true,
								isDriver: true,
							},
						},
						uploadedBy: true,
					},
				})

				if (!document.folder.workerId) {
					throw Error()
				}

				allDocuments = await prisma.workerFolder.findFirst({
					where: {
						workerId: document.folder.workerId,
					},
					select: {
						id: true,
						worker: {
							select: {
								name: true,
							},
						},
						documents: {
							select: {
								status: true,
								name: true,
								reviewNotes: true,
							},
						},
						additionalNotificationEmails: true,
						startupFolder: {
							select: {
								name: true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				})

				totalDocuments = (document.folder as { isDriver: boolean }).isDriver
					? DRIVER_WORKER_STRUCTURE.documents.length
					: BASE_WORKER_STRUCTURE.documents.length

				if (
					allDocuments?.documents.every((d) => d.status === ReviewStatus.APPROVED) &&
					allDocuments.documents.length === totalDocuments
				) {
					await prisma.workerFolder.update({
						where: {
							id: allDocuments.id,
						},
						data: {
							status: ReviewStatus.APPROVED,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName:
								allDocuments.startupFolder.name + " - " + (allDocuments as any)?.worker?.name || "",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: true,
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				totalReviewedDocuments =
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.APPROVED).length || 0) +
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.REJECTED).length || 0)

				if (
					totalReviewedDocuments <= totalDocuments &&
					allDocuments?.documents.every((d) => d.status !== ReviewStatus.SUBMITTED)
				) {
					await prisma.workerFolder.update({
						where: {
							id: allDocuments.id,
						},
						data: {
							status: ReviewStatus.DRAFT,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName:
								allDocuments.startupFolder.name + " - " + (allDocuments as any)?.worker?.name || "",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}
				break
			case DocumentCategory.VEHICLES:
				document = await prisma.vehicleDocument.update({
					where: { id: documentId },
					data: {
						reviewNotes: comments,
						reviewedAt: now,
						status: newStatus,
						reviewer: {
							connect: {
								id: reviewerId,
							},
						},
					},
					select: {
						folder: {
							select: {
								vehicleId: true,
							},
						},
						uploadedBy: true,
					},
				})

				allDocuments = await prisma.vehicleFolder.findFirst({
					where: {
						vehicleId: document.folder.vehicleId,
						startupFolderId,
					},
					select: {
						id: true,
						vehicle: {
							select: {
								plate: true,
								brand: true,
								model: true,
							},
						},
						documents: {
							select: {
								name: true,
								status: true,
								reviewNotes: true,
							},
						},
						additionalNotificationEmails: true,
						startupFolder: {
							select: {
								name: true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				})

				totalDocuments = VEHICLE_STRUCTURE.documents.length

				if (
					allDocuments?.documents.every((d) => d.status === ReviewStatus.APPROVED) &&
					allDocuments.documents.length === totalDocuments
				) {
					await prisma.vehicleFolder.update({
						where: {
							id: allDocuments.id,
						},
						data: {
							status: ReviewStatus.APPROVED,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName:
								allDocuments.startupFolder.name +
								" - " +
								(allDocuments as any)?.vehicle?.plate +
								" " +
								(allDocuments as any)?.vehicle?.brand +
								" " +
								(allDocuments as any)?.vehicle?.model,
							companyName: allDocuments?.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: true,
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				totalReviewedDocuments =
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.APPROVED).length || 0) +
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.REJECTED).length || 0)

				if (
					totalReviewedDocuments <= totalDocuments &&
					allDocuments?.documents.every((d) => d.status !== ReviewStatus.SUBMITTED)
				) {
					await prisma.vehicleFolder.update({
						where: {
							id: allDocuments.id,
						},
						data: {
							status: ReviewStatus.DRAFT,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName:
								allDocuments.startupFolder.name +
								" - " +
								(allDocuments as any)?.vehicle?.plate +
								" " +
								(allDocuments as any)?.vehicle?.brand +
								" " +
								(allDocuments as any)?.vehicle?.model,
							companyName: allDocuments?.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}

				break
			case DocumentCategory.BASIC:
				document = await prisma.basicDocument.update({
					where: { id: documentId },
					data: {
						reviewNotes: comments,
						reviewedAt: now,
						status: newStatus,
						reviewer: {
							connect: {
								id: reviewerId,
							},
						},
					},
					select: {
						folder: {
							select: {
								workerId: true,
							},
						},
						uploadedBy: true,
					},
				})

				if (!document.folder.workerId) {
					throw Error()
				}

				allDocuments = await prisma.basicFolder.findUnique({
					where: {
						workerId_startupFolderId: { workerId: document.folder.workerId, startupFolderId },
					},
					select: {
						id: true,
						worker: {
							select: {
								name: true,
							},
						},
						documents: {
							select: {
								name: true,
								status: true,
								reviewNotes: true,
							},
						},
						additionalNotificationEmails: true,
						startupFolder: {
							select: {
								name: true,
								company: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				})

				totalDocuments = BASIC_FOLDER_STRUCTURE.documents.length

				if (
					allDocuments?.documents.every((d) => d.status === ReviewStatus.APPROVED) &&
					allDocuments.documents.length === totalDocuments
				) {
					await prisma.basicFolder.update({
						where: {
							workerId_startupFolderId: {
								workerId: document.folder.workerId,
								startupFolderId,
							},
						},
						data: {
							status: ReviewStatus.APPROVED,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName:
								allDocuments.startupFolder.name + " - " + (allDocuments as any)?.worker?.name || "",
							companyName: allDocuments?.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: true,
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente ",
					}
				}

				totalReviewedDocuments =
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.APPROVED).length || 0) +
					(allDocuments?.documents.filter((d) => d.status === ReviewStatus.REJECTED).length || 0)

				if (
					totalReviewedDocuments <= totalDocuments &&
					allDocuments?.documents.every((d) => d.status !== ReviewStatus.SUBMITTED)
				) {
					await prisma.basicFolder.update({
						where: {
							workerId_startupFolderId: {
								workerId: document.folder.workerId,
								startupFolderId,
							},
						},
						data: {
							status: ReviewStatus.DRAFT,
						},
					})

					if (allDocuments.startupFolder) {
						sendReviewNotificationEmail({
							folderName: "Documentos Básicos",
							companyName: allDocuments.startupFolder.company.name,
							reviewDate: new Date(),
							reviewer: {
								name: session.user.name,
								email: session.user.email,
								phone: session.user.phone || null,
							},
							isApproved: false,
							rejectedDocuments: allDocuments.documents
								.filter((d) => d.status === ReviewStatus.REJECTED)
								.map((d) => ({
									name: d.name,
									reason: d.reviewNotes || "",
								})),
							emails: allDocuments.additionalNotificationEmails,
						})
					}

					return {
						ok: true,
						message: "Revisión procesada exitosamente",
					}
				}
				break

			default:
				throw new Error(`Categoría de documento no soportada: ${category}`)
		}

		return {
			ok: true,
			message: "Revisión procesada exitosamente",
		}
	} catch (error) {
		console.error("Error al procesar revisión de documento:", error)

		if (error instanceof Error) {
			return {
				ok: false,
				message: `Error al procesar la revisión: ${error.message}`,
			}
		}

		return {
			ok: false,
			message: "Ocurrió un error inesperado al procesar la revisión",
		}
	}
}

type Document =
	| Prisma.SafetyAndHealthDocumentGetPayload<{ include: { uploadedBy: true } }>
	| Prisma.WorkerDocumentGetPayload<{
			select: { folder: { select: { workerId: true; isDriver: true } } }
	  }>
	| Prisma.VehicleDocumentGetPayload<{ select: { folder: { select: { vehicleId: true } } } }>
	| Prisma.EnvironmentDocumentGetPayload<{ include: { uploadedBy: true } }>
	| Prisma.TechSpecsDocumentGetPayload<{ include: { uploadedBy: true } }>
	| Prisma.BasicDocumentGetPayload<{ select: { folder: { select: { workerId: true } } } }>

type AllDocuments =
	| Prisma.SafetyAndHealthFolderGetPayload<{
			select: {
				id: true
				documents: { select: { status: true; name: true; reviewNotes: true } }
				startupFolder: {
					select: { company: { select: { name: true } }; name: true; moreMonthDuration: true }
				}
				additionalNotificationEmails: true
			}
	  }>
	| Prisma.WorkerFolderGetPayload<{
			select: {
				id: true
				documents: { select: { status: true; name: true; reviewNotes: true } }
				startupFolder: {
					select: { company: { select: { name: true } }; name: true; moreMonthDuration: true }
				}
				worker: { select: { name: true } }
				additionalNotificationEmails: true
			}
	  }>
	| Prisma.VehicleFolderGetPayload<{
			select: {
				id: true
				documents: { select: { status: true; name: true; reviewNotes: true } }
				startupFolder: {
					select: { company: { select: { name: true } }; name: true; moreMonthDuration: true }
				}
				vehicle: { select: { plate: true; model: true; brand: true } }
				additionalNotificationEmails: true
			}
	  }>
	| Prisma.EnvironmentFolderGetPayload<{
			select: {
				id: true
				documents: { select: { status: true; name: true; reviewNotes: true } }
				startupFolder: {
					select: { company: { select: { name: true } }; name: true }
					moreMonthDuration: true
				}
				additionalNotificationEmails: true
			}
	  }>
	| Prisma.TechSpecsFolderGetPayload<{
			select: {
				id: true
				documents: { select: { status: true; name: true; reviewNotes: true } }
				startupFolder: {
					select: { company: { select: { name: true } }; name: true }
					moreMonthDuration: true
				}
				additionalNotificationEmails: true
			}
	  }>
	| Prisma.BasicFolderGetPayload<{
			select: {
				id: true
				documents: { select: { status: true; name: true; reviewNotes: true } }
				startupFolder: {
					select: { company: { select: { name: true } }; name: true }
					moreMonthDuration: true
				}
				worker?: { select: { name: true } }
				additionalNotificationEmails: true
			}
	  }>

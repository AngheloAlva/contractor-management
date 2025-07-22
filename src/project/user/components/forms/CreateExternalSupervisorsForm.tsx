"use client"

import { useFieldArray, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircleIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"

import { sendNewUserEmail } from "@/project/user/actions/sendNewUserEmail"
import { generateTemporalPassword } from "@/lib/generateTemporalPassword"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import {
	externalSupervisorsSchema,
	type ExternalSupervisorsSchema,
} from "@/project/user/schemas/externalSupervisors.schema"

import { InputFormField } from "@/shared/components/forms/InputFormField"
import { RutFormField } from "@/shared/components/forms/RutFormField"
import SubmitButton from "@/shared/components/forms/SubmitButton"
import { Card, CardContent } from "@/shared/components/ui/card"
import BackButton from "@/shared/components/BackButton"
import { Button } from "@/shared/components/ui/button"
import { Form } from "@/shared/components/ui/form"

import type { User } from "@prisma/client"

interface CreateExternalSupervisorsFormProps {
	companyId: string
}

export default function CreateExternalSupervisorsForm({
	companyId,
}: CreateExternalSupervisorsFormProps): React.ReactElement {
	const [isSubmitting, setIsSubmitting] = useState(false)

	const router = useRouter()

	const form = useForm<ExternalSupervisorsSchema>({
		resolver: zodResolver(externalSupervisorsSchema),
		defaultValues: {
			supervisors: [
				{
					rut: "",
					name: "",
					email: "",
					phone: "",
					internalArea: "",
					internalRole: "",
				},
			],
		},
	})

	const { fields, append, remove } = useFieldArray({
		control: form.control,
		name: "supervisors",
	})

	async function onSubmit(values: ExternalSupervisorsSchema) {
		setIsSubmitting(true)

		try {
			const results = await Promise.allSettled(
				values.supervisors.map(async (supervisor) => {
					const temporalPassword = generateTemporalPassword()

					const { data: newUser, error } = await authClient.admin.createUser({
						name: supervisor.name,
						email: supervisor.email,
						role: ["partnerCompany"],
						password: temporalPassword,
						data: {
							companyId,
							isSupervisor: true,
							rut: supervisor.rut,
							phone: supervisor.phone,
							internalRole: supervisor.internalRole,
							internalArea: supervisor.internalArea,
						},
					})

					if (error) throw new Error(`Error al crear usuario ${supervisor.name}: ${error.message}`)

					await authClient.admin.setRole({
						userId: newUser.user.id,
						role: ["partnerCompany"],
					})

					sendNewUserEmail({
						name: supervisor.name,
						email: supervisor.email,
						password: temporalPassword,
					})

					return newUser
				})
			)

			const errors = results.filter(
				(result): result is PromiseRejectedResult => result.status === "rejected"
			)
			const successes = results.filter(
				(result): result is PromiseFulfilledResult<{ user: User & { role: string | undefined } }> =>
					result.status === "fulfilled"
			)

			if (errors.length > 0) {
				toast("Error al crear algunos usuarios", {
					description: `${successes.length} usuarios creados exitosamente. ${errors.length} usuarios fallaron.`,
					duration: 5000,
				})
			} else {
				toast("Usuarios creados exitosamente", {
					description: `${successes.length} usuarios han sido creados exitosamente`,
					duration: 3000,
				})
				router.push("/admin/dashboard/empresas")
			}
		} catch (error) {
			console.error(error)
			toast("Error al crear usuarios", {
				description: "Ocurrió un error al intentar crear los usuarios",
				duration: 5000,
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(onSubmit)}
					className="flex w-full max-w-screen-lg flex-col gap-4"
				>
					<div className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-700 p-6">
						<div className="flex items-center justify-between">
							<div className="mx-auto flex w-full max-w-screen-lg items-center justify-start gap-2">
								<BackButton
									href={`/admin/dashboard/empresas/${companyId}`}
									className="bg-white/20 text-white hover:bg-white/50 hover:text-white"
								/>
								<h1 className="w-fit text-2xl font-bold text-white">Nuevos Supervisores</h1>
							</div>

							<Button
								type="button"
								onClick={() => append({ name: "", email: "", rut: "" })}
								className="cursor-pointer bg-white text-blue-600 transition-all hover:scale-105 hover:bg-white hover:text-blue-700"
							>
								Agregar Supervisor <PlusCircleIcon className="ml-2" />
							</Button>
						</div>
					</div>

					{fields.map((field, index) => (
						<Card className="w-full max-w-screen-lg" key={field.id}>
							<CardContent>
								<div
									className={cn("grid gap-4 md:col-span-2 md:grid-cols-2", {
										"mt-6": index >= 1,
									})}
								>
									<div className="flex items-center justify-between md:col-span-2">
										<h4 className="font-medium">Datos del Empleado {index + 1}</h4>

										{index > 0 && (
											<Button
												type="button"
												className="border border-red-500 bg-white text-red-500 hover:bg-red-500 hover:text-white"
												onClick={() => remove(index)}
											>
												Eliminar #{index + 1}
											</Button>
										)}
									</div>

									<InputFormField<ExternalSupervisorsSchema>
										label="Nombre"
										placeholder="Nombre"
										control={form.control}
										name={`supervisors.${index}.name`}
									/>

									<InputFormField<ExternalSupervisorsSchema>
										label="Email"
										placeholder="Email"
										control={form.control}
										name={`supervisors.${index}.email`}
									/>

									<RutFormField<ExternalSupervisorsSchema>
										label="RUT"
										placeholder="RUT"
										control={form.control}
										name={`supervisors.${index}.rut`}
									/>
								</div>
							</CardContent>
						</Card>
					))}

					<SubmitButton isSubmitting={isSubmitting} label="Crear Supervisores" />
				</form>
			</Form>
		</>
	)
}

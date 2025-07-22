"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { DocumentCategory } from "@prisma/client"
import { useForm } from "react-hook-form"
import { useState } from "react"
import { toast } from "sonner"
import { z } from "zod"

import { linkEntity } from "../../actions/link-entity"

import { SwitchFormField } from "@/shared/components/forms/SwitchFormField"
import { Button } from "@/shared/components/ui/button"
import {
	Dialog,
	DialogTitle,
	DialogHeader,
	DialogFooter,
	DialogContent,
	DialogDescription,
} from "@/shared/components/ui/dialog"
import {
	Form,
	FormItem,
	FormLabel,
	FormField,
	FormMessage,
	FormControl,
} from "@/shared/components/ui/form"
import {
	Select,
	SelectItem,
	SelectValue,
	SelectTrigger,
	SelectContent,
} from "@/shared/components/ui/select"

const linkEntitySchema = z.object({
	isDriver: z.boolean().default(false).optional(),
	entityId: z.string().min(1, "Seleccione una entidad"),
})

interface LinkEntityDialogProps {
	isOpen: boolean
	onClose: () => void
	onSuccess: () => void
	startupFolderId: string
	category: DocumentCategory
	entities: Array<{ id: string; name: string }>
}

export function LinkEntityDialog({
	category,
	startupFolderId,
	entities,
	isOpen,
	onClose,
	onSuccess,
}: LinkEntityDialogProps) {
	const [isSubmitting, setIsSubmitting] = useState(false)

	const form = useForm<z.infer<typeof linkEntitySchema>>({
		resolver: zodResolver(linkEntitySchema),
		defaultValues: {
			entityId: "",
			isDriver: false,
		},
	})

	const onSubmit = async (data: z.infer<typeof linkEntitySchema>) => {
		setIsSubmitting(true)

		try {
			const res = await linkEntity({
				startupFolderId,
				entityId: data.entityId,
				isDriver: data.isDriver,
				entityCategory: category,
			})

			if (!res.ok) {
				toast.error("Error", {
					description: res.message,
				})
				return
			}

			toast.success("Entidad vinculada", {
				description: `${category === "VEHICLES" ? "Vehículo" : "Trabajador"} vinculado exitosamente.`,
			})
			form.reset()
			onSuccess()
			onClose()
		} catch (error) {
			console.error(error)
			toast.error("Error al vincular la entidad")
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Vincular {category === "VEHICLES" ? "Vehículo" : "Trabajador"}</DialogTitle>
					<DialogDescription>
						Seleccione {category === "VEHICLES" ? "un vehículo" : "un trabajador"} para vincular a
						esta carpeta de arranque.
					</DialogDescription>
				</DialogHeader>

				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
						<FormField
							control={form.control}
							name="entityId"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{category === "VEHICLES" ? "Vehículo" : "Trabajador"}</FormLabel>
									<Select onValueChange={field.onChange} defaultValue={field.value}>
										<FormControl>
											<SelectTrigger>
												<SelectValue
													placeholder={`Seleccione ${
														category === "VEHICLES" ? "un vehículo" : "un trabajador"
													}`}
												/>
											</SelectTrigger>
										</FormControl>
										<SelectContent>
											{entities.map((entity) => (
												<SelectItem key={entity.id} value={entity.id}>
													{entity.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<FormMessage />
								</FormItem>
							)}
						/>

						{category === DocumentCategory.PERSONNEL && (
							<SwitchFormField name="isDriver" label="¿Es conductor?" control={form.control} />
						)}

						<DialogFooter>
							<Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
								Cancelar
							</Button>

							<Button
								type="submit"
								disabled={isSubmitting}
								className="bg-emerald-600 text-white transition-all hover:scale-105 hover:bg-emerald-700 hover:text-white"
							>
								Vincular
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	)
}

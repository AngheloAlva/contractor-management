"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircleIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { es } from "date-fns/locale"
import { format } from "date-fns"
import { toast } from "sonner"

import { type WorkBookSchema, workBookSchema } from "@/project/work-order/schemas/work-book.schema"
import { updateWorkOrderLikeBook } from "@/project/work-order/actions/updateWorkOrder"
import { WorkOrderPriorityLabels } from "@/lib/consts/work-order-priority"
import { WorkOrderTypeLabels } from "@/lib/consts/work-order-types"
import { WORK_ORDER_PRIORITY } from "@prisma/client"
import { queryClient } from "@/lib/queryClient"
import { cn } from "@/lib/utils"
import {
	useWorkBooksByCompany,
	type WorkBookByCompany,
} from "@/project/work-order/hooks/use-work-books-by-company"

import { SelectWithSearchFormField } from "@/shared/components/forms/SelectWithSearchFormField"
import { DatePickerFormField } from "@/shared/components/forms/DatePickerFormField"
import { InputFormField } from "@/shared/components/forms/InputFormField"
import SubmitButton from "@/shared/components/forms/SubmitButton"
import { Separator } from "@/shared/components/ui/separator"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Form } from "@/shared/components/ui/form"
import {
	Sheet,
	SheetTitle,
	SheetHeader,
	SheetTrigger,
	SheetContent,
	SheetDescription,
} from "@/shared/components/ui/sheet"

interface WorkBookFormProps {
	userId: string
	companyId: string
	className?: string
}

export default function NewWorkBookForm({
	userId,
	className,
	companyId,
}: WorkBookFormProps): React.ReactElement {
	const [loading, setLoading] = useState<boolean>(false)
	const [workOrderSelected, setWorkOrderSelected] = useState<WorkBookByCompany | null>(null)
	const [open, setOpen] = useState(false)

	const form = useForm<WorkBookSchema>({
		resolver: zodResolver(workBookSchema),
		defaultValues: {
			workName: "",
			userId: userId,
			workOrderId: "",
			workLocation: "",
			workStartDate: new Date(),
		},
	})

	useEffect(() => {
		navigator.geolocation.getCurrentPosition((position) => {
			form.setValue("workLocation", `${position.coords.latitude},${position.coords.longitude}`)
		})
	}, [form])

	const { data } = useWorkBooksByCompany({
		page: 1,
		companyId,
		limit: 15,
		search: "",
		onlyBooks: false,
	})

	useEffect(() => {
		const workOrder = data?.workBooks?.find(
			(workOrder) => workOrder.id === form.getValues("workOrderId")
		)
		if (!workOrder) return

		setWorkOrderSelected(workOrder)

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [form.watch("workOrderId")])

	async function onSubmit(values: WorkBookSchema) {
		try {
			setLoading(true)

			if (!workOrderSelected) {
				toast("Error al actualizar el libro de obras", {
					description: "Debe seleccionar una orden de trabajo.",
					duration: 5000,
				})

				return
			}

			const { ok, message } = await updateWorkOrderLikeBook({ id: workOrderSelected.id, values })

			if (ok) {
				toast.success("Libro de obras actualizado", {
					description: message,
					duration: 5000,
				})

				queryClient.invalidateQueries({
					queryKey: ["work-books", { companyId, onlyBooks: true }],
				})
				form.reset()
				setOpen(false)
				setWorkOrderSelected(null)
			} else {
				toast.error("Error al actualizar el libro de obras", {
					description: message,
					duration: 5000,
				})
			}
		} catch (error) {
			console.error(error)

			toast.error("Ocurrió un error al intentar crear el registro", {
				description: (error as Error).message,
				duration: 5000,
			})
		} finally {
			setLoading(false)
		}
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetTrigger
				className={cn(
					"flex h-9 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-white px-3 py-1 text-sm font-semibold tracking-wide text-blue-600 transition-all hover:scale-105",
					className
				)}
				onClick={() => setOpen(true)}
			>
				<PlusCircleIcon className="h-4 w-4" />
				<span className="hidden lg:inline">Libro de Obras</span>
			</SheetTrigger>

			<SheetContent className="gap-0 sm:max-w-xl">
				<SheetHeader className="shadow">
					<SheetTitle>Nuevo Libro de Obras</SheetTitle>
					<SheetDescription>
						Complete la información en el formulario para crear un nuevo libro de obras.
					</SheetDescription>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="grid w-full gap-x-3 gap-y-5 overflow-y-scroll px-4 pt-4 pb-16 sm:grid-cols-2"
					>
						<div className="sm:col-span-2">
							<h2 className="text-lg font-semibold">Orden de Trabajo (OT)</h2>
							<p className="text-muted-foreground text-sm">
								Seleccione una orden de trabajo para crear un libro de obras.
							</p>
						</div>

						<SelectWithSearchFormField<WorkBookSchema>
							name="workOrderId"
							label="Número de OT"
							control={form.control}
							itemClassName="sm:col-span-2"
							placeholder="Seleccione una orden de trabajo"
							options={
								data?.workBooks?.map((workOrder) => ({
									value: workOrder.id,
									label: workOrder.otNumber + " - " + workOrder.workRequest,
								})) ?? []
							}
						/>

						{workOrderSelected && (
							<div className="bg-secondary-background/20 grid gap-y-4 rounded-lg p-3 shadow sm:col-span-2 sm:grid-cols-2">
								<div>
									<h3 className="text-sm font-semibold">Trabajo solicitado:</h3>
									<p className="text-muted-foreground">{workOrderSelected.workRequest}</p>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Tipo de trabajo:</h3>
									<p className="text-muted-foreground">
										{WorkOrderTypeLabels[workOrderSelected.type]}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Prioridad:</h3>
									<Badge
										className={cn("bg-primary/5 border-primary text-primary", {
											"border-red-500 bg-red-500/5 text-red-500":
												workOrderSelected.priority === WORK_ORDER_PRIORITY.HIGH,
											"border-yellow-500 bg-yellow-500/5 text-yellow-500":
												workOrderSelected.priority === WORK_ORDER_PRIORITY.MEDIUM,
											"border-green-500 bg-green-500/5 text-green-500":
												workOrderSelected.priority === WORK_ORDER_PRIORITY.LOW,
										})}
									>
										{WorkOrderPriorityLabels[workOrderSelected.priority]}
									</Badge>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Fecha de solicitud:</h3>
									<p className="text-muted-foreground">
										{format(workOrderSelected.solicitationDate, "PPP", { locale: es })}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Descripción del trabajo:</h3>
									<p className="text-muted-foreground">
										{workOrderSelected.workDescription || "N/A"}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Fecha programada:</h3>
									<p className="text-muted-foreground">
										{format(workOrderSelected.programDate, "PPP", { locale: es })}
									</p>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Horas estimadas:</h3>
									<p className="text-muted-foreground">{workOrderSelected.estimatedHours} horas</p>
								</div>
								<div>
									<h3 className="text-sm font-semibold">Días estimados:</h3>
									<p className="text-muted-foreground">
										{workOrderSelected.estimatedDays} día
										{workOrderSelected.estimatedDays === 1 ? "" : "s"}
									</p>
								</div>
							</div>
						)}

						<Separator className="my-4 sm:col-span-2" />

						<div className="sm:col-span-2">
							<h2 className="text-xl font-bold">Datos Libro de Obras</h2>
							<p className="text-muted-foreground text-sm">
								Complete la información para crear un nuevo libro de obras.
							</p>
						</div>

						<InputFormField<WorkBookSchema>
							name="workName"
							control={form.control}
							label="Nombre de la Obra"
							placeholder="Nombre de la obra"
						/>

						<DatePickerFormField<WorkBookSchema>
							name="workStartDate"
							control={form.control}
							label="Fecha de Inicio"
						/>

						<div className="mt-10 flex items-center justify-center gap-2 sm:col-span-2">
							<Button
								size={"lg"}
								type="button"
								disabled={loading}
								variant={"outline"}
								onClick={() => setOpen(false)}
								className="w-1/2 border-2 border-blue-900 font-medium tracking-wide text-blue-800 transition-all hover:scale-105 hover:bg-blue-900"
							>
								Cancelar
							</Button>

							<SubmitButton
								isSubmitting={loading}
								label="Crear Libro de Obras"
								className="w-1/2 bg-blue-600 hover:bg-blue-700"
							/>
						</div>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	)
}

import {
	CarIcon,
	HomeIcon,
	UsersIcon,
	WrenchIcon,
	FoldersIcon,
	UserPenIcon,
	FileTextIcon,
	LifeBuoyIcon,
	SettingsIcon,
	BookCopyIcon,
	BuildingIcon,
	FilePlus2Icon,
	Building2Icon,
	FileSearchIcon,
	LayoutListIcon,
	MonitorPlayIcon,
	ChartColumnIcon,
	LockKeyholeIcon,
	ShieldPlusIcon,
	BellIcon,
} from "lucide-react"

export const data = {
	navMain: [
		{
			name: "Inicio",
			url: "/dashboard/inicio",
			icon: HomeIcon,
		},
		{
			name: "Colaboradores",
			url: "/dashboard/colaboradores",
			icon: UsersIcon,
		},
		{
			name: "Vehículos y Equipos",
			url: "/dashboard/vehiculos",
			icon: CarIcon,
		},
		{
			name: "Carpetas de Arranque",
			url: "/dashboard/carpetas-de-arranque",
			icon: FoldersIcon,
		},
		{
			name: "Seguridad",
			url: "/dashboard/charlas-de-seguridad",
			icon: MonitorPlayIcon,
		},
		{
			name: "Permiso de Trabajo",
			url: "/dashboard/permiso-de-trabajo",
			icon: FileTextIcon,
		},
		{
			name: "Libro de Obras",
			url: "/dashboard/libro-de-obras",
			icon: BookCopyIcon,
		},
	],
	navAdmin: [
		{
			name: "Inicio",
			url: "/admin/dashboard/inicio",
			icon: HomeIcon,
		},
		{
			name: "Documentación",
			url: "/admin/dashboard/documentacion",
			icon: FileSearchIcon,
		},
		{
			name: "Carpetas de Arranques",
			url: "/admin/dashboard/carpetas-de-arranques",
			icon: FoldersIcon,
		},
		{
			name: "Charlas de Seguridad",
			url: "/admin/dashboard/charlas-de-seguridad",
			icon: MonitorPlayIcon,
		},
		{
			name: "Permisos de Trabajo",
			url: "/admin/dashboard/permisos-de-trabajo",
			icon: FileTextIcon,
		},
		{
			name: "OT / Libros de Obras",
			url: "/admin/dashboard/ordenes-de-trabajo",
			icon: LayoutListIcon,
		},
		{
			name: "Planes de Mantenimiento",
			url: "/admin/dashboard/planes-de-mantenimiento",
			icon: WrenchIcon,
		},
		{
			name: "Solicitudes de Trabajo",
			url: "/admin/dashboard/solicitudes-de-trabajo",
			icon: FilePlus2Icon,
		},
		{
			name: "Reportabilidad",
			url: "/admin/dashboard/reportabilidad",
			icon: ChartColumnIcon,
		},
		{
			name: "Notificaciones",
			url: "/admin/dashboard/notificaciones",
			icon: BellIcon,
		},
	],
	navSecondary: [
		{
			title: "Soporte | Contacto",
			url: "/dashboard/soporte",
			icon: LifeBuoyIcon,
		},
	],
}

export const navInternal = [
	{
		name: "Usuarios Internos",
		url: "/admin/dashboard/usuarios",
		icon: UsersIcon,
	},
	{
		name: "Empresas Contratistas",
		url: "/admin/dashboard/empresas",
		icon: Building2Icon,
	},
	{
		name: "Equipos / Ubicaciones",
		url: "/admin/dashboard/equipos",
		icon: SettingsIcon,
	},
]

export const navOtherAdmin = [
	{
		name: "Datos Personales",
		url: "/admin/dashboard/mi-cuenta/datos-personales",
		icon: UserPenIcon,
	},
	{
		name: "Cambiar Contraseña",
		url: "/admin/dashboard/mi-cuenta/cambiar-contrasena",
		icon: LockKeyholeIcon,
	},
	{
		name: "Activar 2FA",
		url: "/admin/dashboard/mi-cuenta/activar-2fa",
		icon: ShieldPlusIcon,
	},
]

export const navOther = [
	{
		name: "Datos Personales",
		url: "/dashboard/mi-cuenta/datos-personales",
		icon: UserPenIcon,
	},
	{
		name: "Mi Empresa",
		url: "/dashboard/mi-cuenta/mi-empresa",
		icon: BuildingIcon,
	},
	{
		name: "Cambiar Contraseña",
		url: "/dashboard/mi-cuenta/cambiar-contrasena",
		icon: LockKeyholeIcon,
	},
	{
		name: "Activar 2FA",
		url: "/dashboard/mi-cuenta/activar-2fa",
		icon: ShieldPlusIcon,
	},
]

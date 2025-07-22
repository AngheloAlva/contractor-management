"use client"

import Image from "next/image"

import { data, navInternal, navOtherAdmin, navOther } from "./sidebar-data"

import { NavInternal } from "./navInternal"
import { NavOther } from "./navOther"
import { NavMain } from "./navMain"
import { NavUser } from "./navUser"
import {
	Sidebar,
	SidebarRail,
	SidebarFooter,
	SidebarHeader,
	SidebarContent,
} from "@/shared/components/ui/sidebar"

import type { ComponentProps } from "react"
import type { Session } from "@/lib/auth"

interface AppSidebarProps extends ComponentProps<typeof Sidebar> {
	session: Session
}

export function AppSidebar({ session, ...props }: AppSidebarProps) {
	const canAccessAdminRoutes = session.user.accessRole === "ADMIN"
	const canAccessUserRoutes = session.user.accessRole === "USER"

	const navItems = [
		...(!canAccessAdminRoutes && !canAccessUserRoutes ? data.navMain : []),
		...(canAccessAdminRoutes ? [...data.navAdmin] : []),
	]

	return (
		<Sidebar collapsible="icon" variant="sidebar" {...props}>
			<SidebarHeader>
				<div className="flex h-12 w-full items-center gap-2 overflow-hidden p-2 text-left text-sm">
					<div className="flex aspect-square size-14 items-center justify-center">
						<Image alt="Logo" width={70} height={70} src="/logo.svg" />
					</div>
					<div className="grid flex-1 text-left text-sm leading-tight">
						<span className="truncate font-bold">ERP 360</span>
						<span className="truncate text-xs">Operacional</span>
					</div>
				</div>
			</SidebarHeader>

			<SidebarContent>
				<NavMain navItems={navItems} />
				{canAccessAdminRoutes && <NavInternal navItems={navInternal} />}
				<NavOther navItems={canAccessAdminRoutes ? navOtherAdmin : navOther} />

				{/* <NavSecondary items={[myAccountItem, ...data.navSecondary]} className="mt-auto" /> */}
			</SidebarContent>

			<SidebarFooter>
				<NavUser session={session} />
			</SidebarFooter>
			<SidebarRail />
		</Sidebar>
	)
}

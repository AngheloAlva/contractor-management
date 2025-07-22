import { persist } from "zustand/middleware"
import { create } from "zustand"

import type { Order, OrderBy } from "@/shared/components/OrderByButton"

interface UserFiltersState {
	search: string
	page: number
	orderBy: OrderBy
	order: Order
	showOnlyInternal: boolean

	setSearch: (search: string) => void
	setPage: (page: number) => void
	setOrderBy: (orderBy: OrderBy) => void
	setOrder: (order: Order) => void
	setShowOnlyInternal: (showOnlyInternal: boolean) => void

	resetFilters: () => void
	resetPagination: () => void
}

const initialState = {
	search: "",
	page: 1,
	orderBy: "createdAt" as OrderBy,
	order: "asc" as Order,
	showOnlyInternal: true,
}

export const useUserFiltersStore = create<UserFiltersState>()(
	persist(
		(set) => ({
			...initialState,

			setSearch: (search) => {
				set({ search, page: 1 })
			},

			setPage: (page) => {
				set({ page })
			},

			setOrderBy: (orderBy) => {
				set({ orderBy, page: 1 })
			},

			setOrder: (order) => {
				set({ order, page: 1 })
			},

			setShowOnlyInternal: (showOnlyInternal) => {
				set({ showOnlyInternal, page: 1 })
			},

			resetFilters: () => {
				set({
					search: "",
					page: 1,
					orderBy: "createdAt",
					order: "asc",
					showOnlyInternal: true,
				})
			},

			resetPagination: () => {
				set({ page: 1 })
			},
		}),
		{
			name: "user-filters",
			partialize: (state) => ({
				search: state.search,
				orderBy: state.orderBy,
				order: state.order,
				showOnlyInternal: state.showOnlyInternal,
			}),
		}
	)
)
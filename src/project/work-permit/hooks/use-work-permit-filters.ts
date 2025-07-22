import { useWorkPermitFiltersStore } from "@/project/work-permit/stores/work-permit-filters-store"
import { useWorkPermits } from "@/project/work-permit/hooks/use-work-permit"
import { useDebounce } from "@/shared/hooks/useDebounce"

export const useWorkPermitFilters = () => {
	const store = useWorkPermitFiltersStore()
	const debouncedSearch = useDebounce(store.search, 300)

	const workPermitsQuery = useWorkPermits({
		limit: 10,
		page: store.page,
		order: store.order,
		orderBy: store.orderBy,
		search: debouncedSearch,
		dateRange: store.dateRange,
		companyId: store.companyId,
		approvedBy: store.approvedBy,
		statusFilter: store.statusFilter,
	})

	return {
		filters: {
			statusFilter: store.statusFilter,
			companyId: store.companyId,
			approvedBy: store.approvedBy,
			dateRange: store.dateRange,
			search: store.search,
			page: store.page,
			orderBy: store.orderBy,
			order: store.order,
		},

		actions: {
			setStatusFilter: store.setStatusFilter,
			setCompanyId: store.setCompanyId,
			setApprovedBy: store.setApprovedBy,
			setDateRange: store.setDateRange,
			setSearch: store.setSearch,
			setPage: store.setPage,
			setOrderBy: store.setOrderBy,
			setOrder: store.setOrder,
			resetFilters: store.resetFilters,
			resetPagination: store.resetPagination,
		},

		// Query
		workPermits: workPermitsQuery,
	}
}
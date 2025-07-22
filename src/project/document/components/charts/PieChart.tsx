"use client"

import { Cell, Pie, PieChart as RechartsPieChart } from "recharts"

import {
	ChartLegend,
	ChartTooltip,
	ChartContainer,
	ChartTooltipContent,
} from "@/shared/components/ui/chart"

interface PieChartProps {
	data: Array<{ name: string; value: number; fill?: string }>
	colors?: string[]
}

export function PieChart({ data, colors }: PieChartProps) {
	const filteredData = data.filter((item) => item.value > 0)
	// const total = filteredData.reduce((acc, item) => acc + item.value, 0)

	return (
		<ChartContainer className="h-[300px] w-full" config={{}}>
			<RechartsPieChart>
				<Pie
					label
					cx="50%"
					cy="45%"
					fill="#8884d8"
					nameKey="name"
					dataKey="value"
					paddingAngle={3}
					innerRadius={40}
					outerRadius={80}
					data={filteredData}
				>
					{filteredData.map((entry, index) => (
						<Cell
							key={`cell-${index}`}
							fill={
								entry.fill ||
								(colors
									? colors[index % colors.length]
									: `#${Math.floor(Math.random() * 16777215).toString(16)}`)
							}
						/>
					))}
				</Pie>

				<ChartLegend />

				<ChartTooltip content={<ChartTooltipContent />} />
			</RechartsPieChart>
		</ChartContainer>
	)
}

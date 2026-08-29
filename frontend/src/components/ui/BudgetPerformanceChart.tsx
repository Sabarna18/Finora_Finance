// src/features/reports/charts/BudgetPerformanceChart.tsx

import {
    ResponsiveContainer,
    BarChart,
    Bar,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { BudgetPerformanceItem } from "../../api/reports.api";

interface Props {
    data: BudgetPerformanceItem[];
}

export default function BudgetPerformanceChart({
    data,
}: Props) {

    return (
        <div className="h-[360px] rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <h3 className="mb-4 text-lg font-semibold text-zinc-100">
                Budget Performance
            </h3>

            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />

                    <Bar
                        dataKey="budget"
                        fill="#8b5cf6"
                    />

                    <Bar
                        dataKey="spent"
                        fill="#ef4444"
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
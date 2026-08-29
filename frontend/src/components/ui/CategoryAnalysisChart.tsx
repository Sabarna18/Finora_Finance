// src/features/reports/charts/CategoryAnalysisChart.tsx

import { useState } from "react";
import {
    Cell,
    Pie,
    PieChart,
    ResponsiveContainer,
    Sector,
    Tooltip,
} from "recharts";

import { CategoryAnalysisItem } from "../../api/reports.api";

interface Props {
    data: CategoryAnalysisItem[];
}

const PALETTE = [
    "#6ee7b7", // emerald-300
    "#67e8f9", // cyan-300
    "#a5b4fc", // indigo-300
    "#f9a8d4", // pink-300
    "#fcd34d", // amber-300
    "#86efac", // green-300
    "#c4b5fd", // violet-300
    "#fdba74", // orange-300
    "#7dd3fc", // sky-300
    "#f87171", // red-300
];

// Shape renderer factory — closes over activeIndex so no invalid prop is needed
const makeShapeRenderer = (activeIndex: number) => (props: any) => {
    const {
        cx, cy, innerRadius, outerRadius,
        startAngle, endAngle,
        fill, payload, percent, value, index,
    } = props;

    const isActive = index === activeIndex;

    if (!isActive) {
        // Render the default (inactive) sector
        return (
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
        );
    }

    return (
        <g>
            {/* Outer glow ring */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={outerRadius + 6}
                outerRadius={outerRadius + 10}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
                opacity={0.25}
            />
            {/* Active slice — slightly enlarged */}
            <Sector
                cx={cx}
                cy={cy}
                innerRadius={innerRadius}
                outerRadius={outerRadius + 6}
                startAngle={startAngle}
                endAngle={endAngle}
                fill={fill}
            />
            {/* Centre label */}
            <text
                x={cx}
                y={cy - 10}
                textAnchor="middle"
                fill="#f4f4f5"
                style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 15 }}
            >
                {payload.category}
            </text>
            <text
                x={cx}
                y={cy + 14}
                textAnchor="middle"
                fill="#a1a1aa"
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 13 }}
            >
                {`₹${value.toLocaleString()}`}
            </text>
            <text
                x={cx}
                y={cy + 34}
                textAnchor="middle"
                fill={fill}
                style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, fontWeight: 600 }}
            >
                {`${(percent * 100).toFixed(1)}%`}
            </text>
        </g>
    );
};

const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const { category, amount } = payload[0].payload;
    const color = payload[0].payload.fill ?? payload[0].fill;

    return (
        <div
            style={{
                background: "rgba(24,24,27,0.92)",
                border: `1px solid ${color}44`,
                borderRadius: 12,
                padding: "10px 14px",
                backdropFilter: "blur(8px)",
                boxShadow: `0 0 20px ${color}22`,
                fontFamily: "'DM Sans', sans-serif",
            }}
        >
            <p style={{ color: "#a1a1aa", fontSize: 11, marginBottom: 4, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                {category}
            </p>
            <p style={{ color: "#f4f4f5", fontSize: 15, fontWeight: 600, fontFamily: "'DM Mono', monospace" }}>
                ₹{amount.toLocaleString()}
            </p>
        </div>
    );
};

export default function CategoryAnalysisChart({ data }: Props) {
    const [activeIndex, setActiveIndex] = useState<number>(0);
    const renderShape = makeShapeRenderer(activeIndex);

    const total = data.reduce((sum, d) => sum + d.amount, 0);

    // Attach stable fill colours to each datum so tooltip + legend stay in sync
    const coloredData = data.map((d, i) => ({
        ...d,
        fill: PALETTE[i % PALETTE.length],
    }));

    return (
        <div
            style={{
                height: 360,
                borderRadius: 24,
                border: "1px solid #27272a",
                background: "linear-gradient(145deg, #0f0f11 0%, #18181b 60%, #0f0f11 100%)",
                padding: 20,
                display: "flex",
                flexDirection: "column",
                fontFamily: "'DM Sans', sans-serif",
                position: "relative",
                overflow: "hidden",
            }}
        >
            {/* Subtle radial glow in the background */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    background:
                        "radial-gradient(ellipse 60% 50% at 50% 50%, rgba(110,231,183,0.04) 0%, transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            {/* Google Fonts import via a style tag injected once */}
            <style>{`@import url('https://fonts.googleapis.com/css2?family=DM+Mono&family=DM+Sans:wght@400;500;600&display=swap');`}</style>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8, position: "relative" }}>
                <div>
                    <p style={{ fontSize: 11, color: "#52525b", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 2 }}>
                        Breakdown
                    </p>
                    <h3 style={{ fontSize: 17, fontWeight: 600, color: "#f4f4f5", margin: 0 }}>
                        Expense Categories
                    </h3>
                </div>
                <div
                    style={{
                        background: "#18181b",
                        border: "1px solid #27272a",
                        borderRadius: 8,
                        padding: "4px 10px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                    }}
                >
                    <span style={{ fontSize: 10, color: "#52525b", letterSpacing: "0.06em" }}>TOTAL</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#a1a1aa", fontFamily: "'DM Mono', monospace" }}>
                        ₹{total.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Chart + Legend row */}
            <div style={{ display: "flex", flex: 1, minHeight: 0, gap: 8, alignItems: "center" }}>
                {/* Donut chart */}
                <div style={{ flex: "0 0 auto", width: 220, height: "100%" }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={coloredData}
                                dataKey="amount"
                                nameKey="category"
                                cx="50%"
                                cy="50%"
                                innerRadius={68}
                                outerRadius={100}
                                shape={renderShape}
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                strokeWidth={0}
                                paddingAngle={2}
                            >
                                {coloredData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltip />} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Scrollable legend */}
                <div
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        gap: 5,
                        overflowY: "auto",
                        paddingRight: 4,
                        maxHeight: "100%",
                    }}
                >
                    {coloredData.map((entry, i) => {
                        const pct = total > 0 ? (entry.amount / total) * 100 : 0;
                        const isActive = i === activeIndex;

                        return (
                            <div
                                key={entry.category}
                                onMouseEnter={() => setActiveIndex(i)}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "5px 8px",
                                    borderRadius: 8,
                                    cursor: "default",
                                    background: isActive ? `${entry.fill}12` : "transparent",
                                    border: isActive ? `1px solid ${entry.fill}30` : "1px solid transparent",
                                    transition: "background 0.15s, border-color 0.15s",
                                }}
                            >
                                {/* Colour swatch */}
                                <span
                                    style={{
                                        flexShrink: 0,
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background: entry.fill,
                                        boxShadow: isActive ? `0 0 6px ${entry.fill}` : "none",
                                        transition: "box-shadow 0.15s",
                                    }}
                                />
                                {/* Label */}
                                <span
                                    style={{
                                        flex: 1,
                                        fontSize: 12,
                                        color: isActive ? "#f4f4f5" : "#a1a1aa",
                                        fontWeight: isActive ? 500 : 400,
                                        whiteSpace: "nowrap",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        transition: "color 0.15s",
                                    }}
                                >
                                    {entry.category}
                                </span>
                                {/* Percentage pill */}
                                <span
                                    style={{
                                        flexShrink: 0,
                                        fontSize: 10,
                                        fontFamily: "'DM Mono', monospace",
                                        color: entry.fill,
                                        background: `${entry.fill}18`,
                                        borderRadius: 4,
                                        padding: "1px 5px",
                                        letterSpacing: "0.04em",
                                    }}
                                >
                                    {pct.toFixed(1)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
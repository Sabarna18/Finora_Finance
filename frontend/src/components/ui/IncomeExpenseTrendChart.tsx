// src/features/reports/charts/IncomeExpenseTrendChart.tsx

import { useState } from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";

import { IncomeExpenseTrendItem } from "../../api/reports.api";

interface Props {
    data: IncomeExpenseTrendItem[];
}

const monthNames = [
    "",
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Custom Tooltip ──────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null;

    const income = payload.find((p: any) => p.dataKey === "income")?.value ?? 0;
    const expense = payload.find((p: any) => p.dataKey === "expense")?.value ?? 0;
    const net = income - expense;
    const isPositive = net >= 0;

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(n);

    return (
        <div
            style={{
                background: "rgba(9,9,11,0.95)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: "14px 18px",
                boxShadow: "0 24px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
                backdropFilter: "blur(12px)",
                minWidth: 200,
            }}
        >
            {/* Month header */}
            <p style={{
                color: "#a1a1aa",
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                marginBottom: 12,
            }}>
                {label}
            </p>

            {/* Income row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e80" }} />
                    Income
                </span>
                <span style={{ color: "#22c55e", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(income)}
                </span>
            </div>

            {/* Expense row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#a1a1aa", fontSize: 13 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", display: "inline-block", boxShadow: "0 0 8px #ef444480" }} />
                    Expense
                </span>
                <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 14, fontVariantNumeric: "tabular-nums" }}>
                    {fmt(expense)}
                </span>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 10 }} />

            {/* Net */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#71717a", fontSize: 12, fontWeight: 500 }}>Net</span>
                <span style={{
                    color: isPositive ? "#22c55e" : "#ef4444",
                    fontWeight: 800,
                    fontSize: 15,
                    fontVariantNumeric: "tabular-nums",
                }}>
                    {isPositive ? "+" : ""}{fmt(net)}
                </span>
            </div>
        </div>
    );
};

// ── Custom Dot ───────────────────────────────────────────────────────────────
const CustomDot = ({ cx, cy, stroke, value }: any) => {
    if (!value) return null;
    return (
        <g>
            <circle cx={cx} cy={cy} r={5} fill={stroke} stroke="rgba(9,9,11,0.9)" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={9} fill="none" stroke={stroke} strokeWidth={1} strokeOpacity={0.3} />
        </g>
    );
};

// ── Tick formatters ──────────────────────────────────────────────────────────
const YAxisTick = ({ x, y, payload }: any) => (
    <text x={x - 4} y={y} dy={4} textAnchor="end" fill="#52525b" fontSize={11} fontWeight={500}>
        {payload.value >= 1000
            ? `$${(payload.value / 1000).toFixed(0)}k`
            : `$${payload.value}`}
    </text>
);

const XAxisTick = ({ x, y, payload }: any) => (
    <text x={x} y={y + 14} textAnchor="middle" fill="#52525b" fontSize={11} fontWeight={600} letterSpacing="0.05em">
        {payload.value}
    </text>
);

// ── Main Component ────────────────────────────────────────────────────────────
export default function IncomeExpenseTrendChart({ data }: Props) {
    const [activeView, setActiveView] = useState<"both" | "income" | "expense">("both");

    const chartData = data.map((item) => ({
        ...item,
        monthName: monthNames[item.month],
    }));

    // Derived summary stats
    const totalIncome = data.reduce((s, d) => s + d.income, 0);
    const totalExpense = data.reduce((s, d) => s + d.expense, 0);
    const netSavings = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : "0.0";
    const isProfit = netSavings >= 0;

    const fmt = (n: number) =>
        new Intl.NumberFormat("en-US", {
            style: "currency", currency: "USD",
            notation: "compact", maximumFractionDigits: 1,
        }).format(n);

    const incomeOpacity = activeView === "expense" ? 0.15 : 1;
    const expenseOpacity = activeView === "income" ? 0.15 : 1;

    return (
        <div
            style={{
                background: "linear-gradient(145deg, #0c0c0f 0%, #09090b 60%, #0d0d10 100%)",
                borderRadius: 24,
                border: "1px solid rgba(255,255,255,0.06)",
                padding: "24px 24px 16px",
                boxShadow: "0 32px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)",
                position: "relative",
                overflow: "hidden",
                height: 400,
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Subtle ambient glow */}
            <div style={{
                position: "absolute", inset: 0, pointerEvents: "none",
                background: "radial-gradient(ellipse 60% 40% at 30% 0%, rgba(34,197,94,0.04) 0%, transparent 70%), radial-gradient(ellipse 50% 35% at 80% 100%, rgba(239,68,68,0.04) 0%, transparent 70%)",
            }} />

            {/* ── Header ─────────────────────────────────────────────── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, position: "relative" }}>
                {/* Title block */}
                <div>
                    <p style={{ color: "#52525b", fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 4 }}>
                        Financial Overview
                    </p>
                    <h3 style={{ color: "#fafafa", fontSize: 17, fontWeight: 700, margin: 0, letterSpacing: "-0.02em" }}>
                        Income vs Expense Trend
                    </h3>
                </div>

                {/* View toggle pills */}
                <div style={{
                    display: "flex", gap: 4, background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 3,
                }}>
                    {(["both", "income", "expense"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setActiveView(v)}
                            style={{
                                background: activeView === v ? "rgba(255,255,255,0.09)" : "transparent",
                                border: activeView === v ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                                color: activeView === v ? "#fafafa" : "#52525b",
                                borderRadius: 7,
                                padding: "4px 12px",
                                fontSize: 11,
                                fontWeight: 600,
                                letterSpacing: "0.05em",
                                cursor: "pointer",
                                textTransform: "capitalize",
                                transition: "all 0.2s ease",
                            }}
                        >
                            {v === "both" ? "All" : v.charAt(0).toUpperCase() + v.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── KPI Strip ──────────────────────────────────────────── */}
            <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
                {/* Income */}
                <div style={{
                    flex: 1, background: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.12)",
                    borderRadius: 12, padding: "10px 14px",
                }}>
                    <p style={{ color: "#4ade80", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
                        Total Income
                    </p>
                    <p style={{ color: "#dcfce7", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(totalIncome)}
                    </p>
                </div>

                {/* Expense */}
                <div style={{
                    flex: 1, background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.12)",
                    borderRadius: 12, padding: "10px 14px",
                }}>
                    <p style={{ color: "#f87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
                        Total Expense
                    </p>
                    <p style={{ color: "#fee2e2", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                        {fmt(totalExpense)}
                    </p>
                </div>

                {/* Net */}
                <div style={{
                    flex: 1,
                    background: isProfit ? "rgba(34,197,94,0.06)" : "rgba(239,68,68,0.06)",
                    border: `1px solid ${isProfit ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)"}`,
                    borderRadius: 12, padding: "10px 14px",
                }}>
                    <p style={{ color: isProfit ? "#4ade80" : "#f87171", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 4px" }}>
                        Net · {savingsRate}%
                    </p>
                    <p style={{ color: isProfit ? "#dcfce7" : "#fee2e2", fontSize: 18, fontWeight: 800, margin: 0, letterSpacing: "-0.03em", fontVariantNumeric: "tabular-nums" }}>
                        {isProfit ? "+" : ""}{fmt(netSavings)}
                    </p>
                </div>
            </div>

            {/* ── Chart ──────────────────────────────────────────────── */}
            <div style={{ flex: 1, minHeight: 0 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.35} />
                                <stop offset="75%" stopColor="#22c55e" stopOpacity={0.05} />
                                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity={0.35} />
                                <stop offset="75%" stopColor="#ef4444" stopOpacity={0.05} />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            stroke="rgba(255,255,255,0.04)"
                            strokeDasharray="4 4"
                            vertical={false}
                        />

                        <XAxis
                            dataKey="monthName"
                            axisLine={false}
                            tickLine={false}
                            tick={<XAxisTick />}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={<YAxisTick />}
                            width={44}
                        />

                        <Tooltip
                            content={<CustomTooltip />}
                            cursor={{
                                stroke: "rgba(255,255,255,0.08)",
                                strokeWidth: 1,
                                strokeDasharray: "4 4",
                            }}
                        />

                        {/* Income area */}
                        <Area
                            dataKey="income"
                            stroke="#22c55e"
                            strokeWidth={2}
                            fill="url(#incomeGrad)"
                            dot={false}
                            activeDot={<CustomDot stroke="#22c55e" />}
                            style={{ opacity: incomeOpacity, transition: "opacity 0.3s ease" }}
                        />

                        {/* Expense area */}
                        <Area
                            dataKey="expense"
                            stroke="#ef4444"
                            strokeWidth={2}
                            fill="url(#expenseGrad)"
                            dot={false}
                            activeDot={<CustomDot stroke="#ef4444" />}
                            style={{ opacity: expenseOpacity, transition: "opacity 0.3s ease" }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* ── Legend ─────────────────────────────────────────────── */}
            <div style={{
                display: "flex", justifyContent: "center", gap: 24,
                paddingTop: 10, borderTop: "1px solid rgba(255,255,255,0.05)", marginTop: 8,
            }}>
                {[
                    { color: "#22c55e", label: "Income", glow: "#22c55e40" },
                    { color: "#ef4444", label: "Expense", glow: "#ef444440" },
                ].map(({ color, label, glow }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{
                            width: 24, height: 3, borderRadius: 999,
                            background: color,
                            boxShadow: `0 0 8px ${glow}`,
                        }} />
                        <span style={{ color: "#71717a", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em" }}>
                            {label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
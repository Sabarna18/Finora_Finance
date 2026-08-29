// src/features/reports/cards/CashFlowCards.tsx

import {
    Wallet,
    TrendingDown,
    PiggyBank,
    Percent,
} from "lucide-react";

import { CashFlowResponse } from "../../api/reports.api";

interface Props {
    data: CashFlowResponse;
}

const currency = new Intl.NumberFormat(
    "en-IN",
    {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }
);

export default function CashFlowCards({
    data,
}: Props) {

    const cards = [
        {
            label: "Income",
            value: currency.format(data.income),
            icon: Wallet,
        },
        {
            label: "Expense",
            value: currency.format(data.expense),
            icon: TrendingDown,
        },
        {
            label: "Savings",
            value: currency.format(data.savings),
            icon: PiggyBank,
        },
        {
            label: "Savings Rate",
            value: `${data.savings_rate.toFixed(1)}%`,
            icon: Percent,
        },
    ];

    return (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;

                return (
                    <div
                        key={card.label}
                        className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5"
                    >
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-zinc-400">
                                {card.label}
                            </p>

                            <Icon
                                size={18}
                                className="text-violet-400"
                            />
                        </div>

                        <h3 className="mt-4 text-2xl font-bold text-zinc-100">
                            {card.value}
                        </h3>
                    </div>
                );
            })}
        </section>
    );
}
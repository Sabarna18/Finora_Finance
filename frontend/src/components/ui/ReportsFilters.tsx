// src/features/reports/components/ReportsFilters.tsx

interface Props {
    month: number;
    year: number;
    startDate: string;
    endDate: string;

    onMonthChange: (value: number) => void;
    onYearChange: (value: number) => void;
    onStartDateChange: (value: string) => void;
    onEndDateChange: (value: string) => void;
}

const months = [
    "January", "February", "March", "April",
    "May", "June", "July", "August",
    "September", "October", "November", "December",
];

export default function ReportsFilters({
    month,
    year,
    startDate,
    endDate,
    onMonthChange,
    onYearChange,
    onStartDateChange,
    onEndDateChange,
}: Props) {

    const currentYear = new Date().getFullYear();

    const years = Array.from(
        { length: 6 },
        (_, i) => currentYear - i
    );

    return (
        <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-5">
            <div className="flex flex-wrap gap-4">

                <select
                    value={month}
                    onChange={(e) =>
                        onMonthChange(Number(e.target.value))
                    }
                    className="h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100"
                >
                    {months.map((monthName, index) => (
                        <option
                            key={monthName}
                            value={index + 1}
                        >
                            {monthName}
                        </option>
                    ))}
                </select>

                <select
                    value={year}
                    onChange={(e) =>
                        onYearChange(Number(e.target.value))
                    }
                    className="h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100"
                >
                    {years.map((yearValue) => (
                        <option
                            key={yearValue}
                            value={yearValue}
                        >
                            {yearValue}
                        </option>
                    ))}
                </select>

                <input
                    type="date"
                    value={startDate}
                    onChange={(e) =>
                        onStartDateChange(e.target.value)
                    }
                    className="h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100"
                />

                <input
                    type="date"
                    value={endDate}
                    onChange={(e) =>
                        onEndDateChange(e.target.value)
                    }
                    className="h-11 rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-zinc-100"
                />

            </div>
        </section>
    );
}
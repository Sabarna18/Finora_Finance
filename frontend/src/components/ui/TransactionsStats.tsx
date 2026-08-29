import {
    TransactionResponse,
    TransactionType,
} from "../../api/transactions.api";


interface Props {
    transactions:
    TransactionResponse[];
}


export default function TransactionStats({
    transactions,
}: Props) {

    const income =
        transactions
            .filter(
                (transaction) =>
                    transaction.type ===
                    TransactionType.INCOME
            )
            .reduce(
                (sum, transaction) =>
                    sum + transaction.amount,
                0
            );


    const expense =
        transactions
            .filter(
                (transaction) =>
                    transaction.type ===
                    TransactionType.EXPENSE
            )
            .reduce(
                (sum, transaction) =>
                    sum + transaction.amount,
                0
            );


    return (

        <div
            className="
        grid
        gap-4
        md:grid-cols-3
      "
        >

            <StatCard
                title="Transactions"
                value={
                    transactions.length
                }
            />

            <StatCard
                title="Income"
                value={`₹${income}`}
                income
            />

            <StatCard
                title="Expense"
                value={`₹${expense}`}
                expense
            />

        </div>

    );

}


function StatCard({
    title,
    value,
    income,
    expense,
}: any) {

    return (

        <div
            className={`
        rounded-3xl
        border
        p-5

        ${income
                    ? `
            border-emerald-900
            bg-emerald-950/20
          `
                    : expense
                        ? `
            border-red-900
            bg-red-950/20
          `
                        : `
            border-zinc-800
            bg-zinc-950
          `
                }
      `}
        >

            <p
                className="
          text-xs
          uppercase
          tracking-wide
          text-zinc-500
        "
            >
                {title}
            </p>

            <h2
                className="
          mt-3
          text-3xl
          font-bold
          text-white
        "
            >
                {value}
            </h2>

        </div>

    );

}
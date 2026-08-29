import type { RecentTransactionItem } from "../../api/dashboard.api";

interface Props {
  transactions: RecentTransactionItem[];
}


export default function RecentTransactionsCard({
  transactions,
}: Props) {

  return (

    <div
      className="
        rounded-3xl
        border
        border-zinc-800/60
        bg-zinc-950
        p-6
      "
    >

      <div
        className="
          flex
          items-center
          justify-between
        "
      >

        <h2
          className="
            text-lg
            font-semibold
            text-white
          "
        >
          Recent Transactions
        </h2>

      </div>


      <div
        className="
          mt-6
          space-y-4
        "
      >

        {transactions.map((transaction) => (

          <div
            key={transaction.id}
            className="
              flex
              items-center
              justify-between

              rounded-2xl

              border
              border-zinc-800/60

              bg-zinc-900/50

              p-4
            "
          >

            <div>

              <p
                className="
                  text-sm
                  font-medium
                  text-zinc-100
                "
              >
                {transaction.description || "Transaction"}
              </p>

              <p
                className="
                  mt-1
                  text-xs
                  text-zinc-500
                "
              >
                {new Date(
                  transaction.date
                ).toLocaleDateString()}
              </p>

            </div>


            <p
              className={`
                text-sm
                font-semibold

                ${
                  transaction.type === "income"
                    ? "text-emerald-400"
                    : "text-red-400"
                }
              `}
            >
              ₹{transaction.amount}
            </p>

          </div>

        ))}

      </div>

    </div>

  );

}
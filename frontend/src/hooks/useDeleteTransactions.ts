import {
    deleteTransaction,
} from "../api/transactions.api";


export function useDeleteTransaction() {

    async function mutate(
        transactionId: number
    ) {

        return await deleteTransaction(
            transactionId
        );

    }

    return { mutate };

}
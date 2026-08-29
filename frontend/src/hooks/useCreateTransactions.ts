import {
    createTransaction,
    TransactionCreate,
} from "../api/transactions.api";


export function useCreateTransaction() {

    async function mutate(
        payload: TransactionCreate
    ) {

        return await createTransaction(
            payload
        );

    }

    return { mutate };

}
import {
  updateTransaction,
  TransactionUpdate,
} from "../api/transactions.api";


export function useUpdateTransaction() {

  async function mutate(
    id: number,
    payload: TransactionUpdate
  ) {

    return await updateTransaction(
      id,
      payload
    );

  }

  return { mutate };

}
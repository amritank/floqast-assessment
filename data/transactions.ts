export type TransactionInput = {
  amount: number;
  transactionType: string;
  recipientId: string;
};

export function createTransaction(
  overrides: Partial<TransactionInput> = {},
): TransactionInput {
  return {
    amount: 10,
    transactionType: "transfer",
    recipientId: "2",
    ...overrides,
  };
}

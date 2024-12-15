import { PendingTransaction, UnsignedTransaction } from '@proto-kit/sequencer'

export function isPendingTransaction(
	transaction: PendingTransaction | UnsignedTransaction | undefined
): asserts transaction is PendingTransaction {
	if (!(transaction instanceof PendingTransaction))
		throw new Error('Transaction is not a PendingTransaction')
}

import { toast } from '@/components/ui/use-toast'
import { TransactionJSON } from '@/core/controllers/wallet-controller'
import { useWallet } from '@/core/hooks'
import { truncateMiddle } from '@/lib/utils'
import { useEffect, useRef } from 'react'

export const notifyTransaction = (transaction: TransactionJSON) => {
	const hash = truncateMiddle(transaction.hash.toString(), 15, 15, '...')

	function title() {
		switch (transaction.status) {
			case 'PENDING':
				return `⏳ Transaction sent: ${transaction.methodModule}.${transaction.methodName}`
			case 'SUCCESS':
				return `✅ Transaction successful: ${transaction.methodModule}.${transaction.methodName}`
			case 'FAILURE':
				return `❌ Transaction failed: ${transaction.methodModule}.${transaction.methodName}`
		}
	}

	toast({
		title: title(),
		description: (
			<div>
				{transaction.statusMessage && (
					<p>
						<b>Message:</b> {transaction.statusMessage}
					</p>
				)}
				<p>
					<b>Hash</b>: {hash}
				</p>
			</div>
		),
	})
}

export const useNotifyTransactions = () => {
	const notifiedTransactions = useRef(new Set<string>())
	const { transactions } = useWallet()
	useEffect(() => {
		transactions.forEach(transaction => {
			const key = `${transaction.hash}-${transaction.status}`
			if (notifiedTransactions.current.has(key)) return
			notifyTransaction(transaction)
			notifiedTransactions.current.add(key)
		})
	}, [transactions])
}

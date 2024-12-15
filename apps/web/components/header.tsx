'use client'

import { Button } from '@/components/ui/button'
import { ChainStatus } from './chain-status'
import { Separator } from './ui/separator'
import { Montserrat } from 'next/font/google'
import { cn } from '@/lib/cn'
import { truncateWalletAddress } from '@/lib/utils'
import Link from 'next/link'
import { useWallet } from '@/core/hooks'
import { useToast } from './ui/use-toast'
import { useCallback, useState } from 'react'
import InstallAuroWalletModal from './install-auro-wallet-modal'

const montserrat = Montserrat({
	subsets: ['latin'],
	weight: ['600', '700'],
})

export interface HeaderProps {
	loading: boolean
	wallet?: string
	onConnectWallet: () => void
	balance?: string
	balanceLoading: boolean
	blockHeight?: string
}

export default function Header() {
	const {
		account,
		loading,
		initialized: walletInitialized,
		connect,
		connected,
	} = useWallet()
	const [openInstallAuroWalletModal, setOpenInstallAuroWalletModal] =
		useState(false)

	const { toast } = useToast()

	const showWallet = connected && account

	const handleConnect = useCallback(async () => {
		try {
			if (!walletInitialized) {
				setOpenInstallAuroWalletModal(true)
				return
			}
			await connect()
		} catch (error) {
			console.error('Error connecting wallet', error)
			const message =
				error instanceof Error ? error.message : 'Check logs for more details'
			toast({
				title: 'Error connecting wallet',
				description: message,
				variant: 'destructive',
			})
		}
	}, [connect, toast, walletInitialized])

	return (
		<>
			<header className="flex justify-center border-b bg-white p-2 shadow-sm">
				<div className="flex w-full max-w-7xl items-center justify-between">
					<div className="flex items-center">
						<Link href="/">
							<h1 className={cn(montserrat.className, 'text-xl')}>
								<span className="bg-gradient-to-b from-zinc-600 to-zinc-800 bg-clip-text font-semibold text-transparent">
									Zero
								</span>
								<span className="bg-gradient-to-b from-violet-500 to-violet-700 bg-clip-text font-bold text-transparent">
									Poll
								</span>
							</h1>
						</Link>
						<Separator className="mx-4 h-8" orientation={'vertical'} />
						<div className="flex-grow">
							<ChainStatus />
						</div>
					</div>
					<div>
						{/* wallet */}
						<Button
							loading={loading}
							onClick={handleConnect}
							variant="secondary"
						>
							{showWallet ? (
								<>
									<div className="hidden text-sm sm:block">
										{truncateWalletAddress(account, 7)}
									</div>
									<div className="text-xs sm:hidden">
										{truncateWalletAddress(account, 4)}
									</div>
								</>
							) : (
								<div className="text-sm">Connect Wallet</div>
							)}
						</Button>
					</div>
				</div>
			</header>
			<InstallAuroWalletModal
				open={openInstallAuroWalletModal}
				onOpenChange={setOpenInstallAuroWalletModal}
			/>
		</>
	)
}

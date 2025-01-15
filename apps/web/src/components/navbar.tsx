'use client';

import { Button } from '@/components/ui/button';
import { ChainStatus } from './chain-status';
import { Separator } from './ui/separator';
import { Montserrat } from 'next/font/google';
import { cn } from '@/lib/cn';
import { truncateWalletAddress } from '@/lib/utils';
import Link from 'next/link';
import { useWallet } from '@zeropoll/react';
import { useToast } from './ui/use-toast';
import { useCallback, useState } from 'react';
import InstallAuroWalletModal from './install-auro-wallet-modal';

const montserrat = Montserrat({
	subsets: ['latin'],
	weight: ['600', '700'],
});

export function Navbar() {
	const {
		account,
		loading,
		initialized: walletInitialized,
		connect,
		connected,
	} = useWallet();
	const [openInstallAuroWalletModal, setOpenInstallAuroWalletModal] =
		useState(false);

	const { toast } = useToast();

	const showWallet = connected && account;

	const handleConnect = useCallback(async () => {
		try {
			if (!walletInitialized) {
				setOpenInstallAuroWalletModal(true);
				return;
			}
			await connect();
		} catch (error) {
			console.error('Error connecting wallet', error);
			const message =
				error instanceof Error ? error.message : 'Check logs for more details';
			toast({
				title: 'Error connecting wallet',
				description: message,
				variant: 'destructive',
			});
		}
	}, [connect, toast, walletInitialized]);

	return (
		<>
			<nav className="sticky left-0 right-0 top-0 z-50 mb-8 border-b border-zinc-200 bg-white/80 backdrop-blur-lg">
				<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
					<div className="flex h-16 items-center justify-between">
						<div className="flex items-center">
							<Link href="/">
								<h1 className={cn(montserrat.className, 'text-2xl font-bold')}>
									<span className="text-zinc-700">Zero</span>
									<span className="text-primary">Poll</span>
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
								className="button-3d bg-primary hover:bg-primary/90"
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
				</div>
			</nav>
			<InstallAuroWalletModal
				open={openInstallAuroWalletModal}
				onOpenChange={setOpenInstallAuroWalletModal}
			/>
		</>
	);
}

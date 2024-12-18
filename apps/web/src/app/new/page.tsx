'use client';

import { useWallet } from '@zeropoll/react';
import { PollFormCard } from '@/components/poll-form-card';
import { ConnectWalletModal } from '@/components/connect-wallet-modal';
import { cn } from '@/lib/cn';

export default function PollFormPage() {
	const { connected, initialized } = useWallet();

	const openConnectWalletModal = initialized && !connected;

	return (
		<>
			<PollFormCard className={cn(openConnectWalletModal && 'blur-sm')} />
			<ConnectWalletModal open={openConnectWalletModal} />
		</>
	);
}

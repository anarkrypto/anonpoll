'use client';

import { CreatePollResult, useWallet } from '@zeropoll/react';
import { PollFormCard } from '@zeropoll/react-ui';
import { ConnectWalletModal } from '@/components/connect-wallet-modal';
import { cn } from '@/lib/cn';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';

export default function PollFormPage() {
	const router = useRouter();
	const { toast } = useToast();

	const { connected, initialized } = useWallet();

	const openConnectWalletModal = initialized && !connected;

	const onSuccess = ({ id, encryptionKey }: CreatePollResult) => {
		router.push(`/polls/${id}?key=${encryptionKey}`);
	};

	const onCloseConnectWalletModal = () => {
		router.push('/');
	};

	const onError = (message: string) => {
		toast({
			title: 'Error',
			description: message,
			variant: 'destructive',
		});
	};

	return (
		<>
			<PollFormCard
				className={cn(openConnectWalletModal && 'blur-sm')}
				onSuccess={onSuccess}
				onError={onError}
			/>
			<ConnectWalletModal
				open={openConnectWalletModal}
				onOpenChange={open => !open && onCloseConnectWalletModal()}
			/>
		</>
	);
}

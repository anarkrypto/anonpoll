'use client';

import { useToast } from '@/components/ui/use-toast';
import { PollCard } from '@zeropoll/react-ui';
import { use } from 'react';

export default function PollPage(props: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ key?: string }>;
}) {
	const { toast } = useToast();

	const searchParams = use(props.searchParams);
	const params = use(props.params);

	return (
		<PollCard
			id={params.id}
			encryptionKey={searchParams.key}
			onVoteError={message => {
				toast({
					title: 'Error Voting',
					description: message,
					variant: 'destructive',
				});
			}}
		/>
	);
}

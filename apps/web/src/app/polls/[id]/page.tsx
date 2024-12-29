'use client';

import { PollCard } from '@zeropoll/react-ui';
import { use } from 'react';

export default function PollPage(props: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ key?: string }>;
}) {
	const searchParams = use(props.searchParams);
	const params = use(props.params);

	return <PollCard id={params.id} encryptionKey={searchParams.key} />;
}

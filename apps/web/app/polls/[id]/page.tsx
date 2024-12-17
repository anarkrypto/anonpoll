import { PollCard } from '@/components/poll-card';

export default async function PollPage({
	params,
	searchParams,
}: {
	params: { id: string };
	searchParams: { key?: string };
}) {
	return <PollCard id={params.id} encryptionKey={searchParams.key} />;
}

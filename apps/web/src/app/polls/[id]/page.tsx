import { PollCard } from '@zeropoll/react-ui';

export default async function PollPage(props: {
	params: Promise<{ id: string }>;
	searchParams: Promise<{ key?: string }>;
}) {
	const searchParams = await props.searchParams;
	const params = await props.params;
	return <PollCard id={params.id} encryptionKey={searchParams.key} />;
}

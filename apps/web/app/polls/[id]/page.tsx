import { PollCard } from "@/components/poll-card";

export default async function PollPage({
  params,
}: {
  params: { id: string };
}) {
  return <PollCard id={params.id} />;
}

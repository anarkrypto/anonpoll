import { PollCard } from "@/components/poll-card";

export default async function PollPage({
  params,
}: {
  params: { pollId: string };
}) {
  const pollId = Number(params.pollId);

  if (isNaN(pollId) || pollId <= 0) {
    return <div>Invalid Poll</div>;
  }

  return <PollCard id={pollId} />;
}

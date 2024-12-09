import { PollCard } from "@/components/poll-card";
import { isCID } from "@/core/utils/cid";

export default async function PollPage({
  params,
}: {
  params: { pollCid: string };
}) {
  if (!isCID(params.pollCid)) {
    return <div>Invalid Poll</div>;
  }

  return <PollCard cid={params.pollCid} />;
}

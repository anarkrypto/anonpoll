import { PollCard } from "@/components/poll-card";
import { prisma } from "@/lib/prisma";
import { PollsRepositoryPostgres } from "@/repositories/prisma/polls-repository-postgres";

export default async function PollPage({
  params,
}: {
  params: { pollId: string };
}) {

  const pollId = Number(params.pollId);

  if (isNaN(pollId) || pollId <= 0) {
    return <div>Poll not found</div>;
  }

  const pollRepo = new PollsRepositoryPostgres(prisma);

  const data = await pollRepo.getPoll(pollId);

  if (!data) {
    return <div>Poll not found</div>;
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <PollCard
        id={pollId}
        title={data.title}
        description={data.description}
      />
    </div>
  );
}

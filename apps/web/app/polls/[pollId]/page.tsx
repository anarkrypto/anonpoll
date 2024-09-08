import { PollCard } from "@/components/poll-card";
import { prisma } from "@/lib/prisma";
import { PollsRepositoryPostgres } from "@/repositories/prisma/polls-repository-postgres";
import { unstable_cache } from "next/cache";

const getCachedPoll = async (pollId: number) => {
  // Since poll metadata does not chang never (title, description, votersWallets...),
  // we can safely cache it permanently.
  // However, while in development, chain can be reseted, so we only cache it for 60 seconds.
  // Note that it also caches null results when not found.In the route API, it's automatically
  // revalidated when the poll is created.
  const isProduction = process.env.NODE_ENV === "production";
  return await unstable_cache(
    async () => {
      const pollRepo = new PollsRepositoryPostgres(prisma);
      const poll = await pollRepo.getPoll(pollId);
      return poll;
    },
    ["poll", `poll-${pollId}`],
    {
      revalidate: isProduction ? false : 60,
      tags: ["poll", `poll-${pollId}`],
    },
  )();
};

export default async function PollPage({
  params,
}: {
  params: { pollId: string };
}) {
  const pollId = Number(params.pollId);

  if (isNaN(pollId) || pollId <= 0) {
    return <div>Poll not found</div>;
  }

  const data = await getCachedPoll(pollId);

  if (!data) {
    return <div>Poll not found</div>;
  }

  return (
    <PollCard
      id={pollId}
      title={data.title}
      description={data.description}
      options={data.options}
      votersWallets={data.votersWallets}
      createdAt={data.createdAt}
      salt={data.salt}
    />
  );
}

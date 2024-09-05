"use client";

import "reflect-metadata";

import { PollCard } from "@/components/poll-card";

export default function PollPage({ params }: { params: { pollId: string } }) {

  // TODO: add extra validation for pollId
  const pollId = Number(params.pollId);

  return (
    <div className="flex flex-1 flex-col items-center justify-center p-4 md:p-8">
      <PollCard pollId={pollId} />
    </div>
  );
}

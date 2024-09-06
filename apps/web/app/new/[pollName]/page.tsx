"use client";

import { VotersCard } from "@/components/voters-card";
import { useCreatePoll } from "@/lib/stores/poll";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type User = {
  nickname: string;
  wallet: string;
};

export default function AddVoters({
  params: { pollName },
}: {
  params: { pollName: string };
}) {
  const router = useRouter();
  const { createPoll, pollId } = useCreatePoll({ onError: console.error });

  const handleConfirm = (users: User[]) => {
    const walletsAddresses = users.map((user) => user.wallet);
    createPoll(pollName, walletsAddresses);
  };

  useEffect(() => {
    if (pollId) {
      router.push(`/polls/${pollId}`);
    }
  }, [pollId]);

  return <VotersCard onConfirm={handleConfirm} />;
}

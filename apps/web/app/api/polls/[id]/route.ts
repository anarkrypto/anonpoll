import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PollsRepositoryPostgres } from "@/repositories/prisma/polls-repository-postgres";
import { verifyAuthJwtToken } from "@/lib/auth";
import { client } from "chain";
import { UInt32 } from "@proto-kit/library";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const id = Number(params.id);

  if (!id || isNaN(id)) {
    return Response.json({ message: "Invalid poll id" }, { status: 400 });
  }

  const jwtToken = request.headers.get("Authorization")?.replace("Bearer ", "");

  if (!jwtToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { payload } = await verifyAuthJwtToken(jwtToken);

  if (!payload) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  await client.start();
  const onChainPoll = await client.query.runtime.Poll.commitments.get(
    UInt32.from(id),
  );

  if (!onChainPoll) {
    return Response.json({ message: "Poll not found" }, { status: 404 });
  }

  const repository = new PollsRepositoryPostgres(prisma);
  const poll = await repository.getPoll(id);

  if (!poll) {
    return Response.json({ message: "Poll not found" }, { status: 404 });
  }

  return Response.json(poll);
}

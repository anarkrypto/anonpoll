import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { PollsRepositoryPostgres } from "@/repositories/prisma/polls-repository-postgres";
import { verifyAuthJwtToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { pollInsertSchema } from "@/schemas/poll";
import { client } from "chain";
import { UInt32 } from "@proto-kit/library";
import { revalidateTag } from "next/cache";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { data, error } = pollInsertSchema.safeParse(body);

  if (error) {
    return Response.json({ message: error.message }, { status: 400 });
  }

  const jwtToken = cookies().get("auth.token")?.value;

  if (!jwtToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { payload } = await verifyAuthJwtToken(jwtToken);

  if (!payload) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  await client.start();
  const poll = await client.query.runtime.Poll.commitments.get(UInt32.from(data.id));
  if (!poll) {
    return Response.json({ message: "Poll not found" }, { status: 404 });
  }

  const repository = new PollsRepositoryPostgres(prisma);
  await repository.createPoll({
    id: data.id,
    title: data.title,
    description: data.description || null,
    options: data.options,
    votersWallets: data.votersWallets,
    creatorWallet: payload.publicKey,
    salt: data.salt,
    createdAt: new Date(),
  });

  revalidateTag(`poll-${data.id}`);

  return Response.json({ message: "Poll created" });
}

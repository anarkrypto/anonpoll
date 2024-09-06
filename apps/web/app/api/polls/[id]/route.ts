import { verifyAuthJwtToken } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PollsRepositoryPostgres } from "@/repositories/prisma/polls-repository-postgres";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {

  const jwtToken = cookies().get("auth.token")?.value;

  if (!jwtToken) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { payload } = await verifyAuthJwtToken(jwtToken);

  if (!payload) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const pollRepo = new PollsRepositoryPostgres(prisma);

  const data = await pollRepo.getPoll(Number(params.id));

  if (!data) {
    return Response.json({ error: "Poll not found" }, { status: 404 });
  }

  if (data.creatorWallet !== payload.publicKey && !data.votersWallets.includes(payload.publicKey)) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  return Response.json({ data });
}

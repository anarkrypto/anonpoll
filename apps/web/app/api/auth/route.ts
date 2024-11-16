import { generateAuthJwtToken, verifyAuthSignature } from "@/lib/auth";
import { authSchema } from "@/schemas/auth";

export const POST = async (req: Request) => {
  const { data, error } = authSchema.safeParse(await req.json());
  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  const isValid = verifyAuthSignature(data);
  if (!isValid) {
    return Response.json({ message: "Invalid signature" }, { status: 401 });
  }

  const jwtToken = await generateAuthJwtToken({ publicKey: data.publicKey });

  return Response.json({ token: jwtToken }, { status: 200 });
};

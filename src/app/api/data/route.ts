import { add } from "@/lib/auth";
import { formSchema } from "@/lib/form";
import { z } from "zod";

export async function POST(req: Request) {
  const body = await req.json();
  try {
    await add(body as z.infer<typeof formSchema>);
    return new Response(null, {
      status: 201,
    });
  } catch {
    return new Response(null, {
      status: 500,
    });
  }
}
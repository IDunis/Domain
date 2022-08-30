import { redirect } from "@remix-run/node";
import crypto from "crypto";
import { getCurrentUserId } from "./auth.server";
import { getUserSession } from "./session.server";

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getCurrentUserId(request);
    if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo],
    ]);    
    throw redirect(`/login?${searchParams}`);
  }  
  return userId;
}

export async function verifyShopifyRequest(request: Request) {
  const url = new URL(request.url);
  const state = url.searchParams.get("state");
  const session = await getUserSession(request);
  const storedState = session.get("state");

  // 1. Verify that the state matches the one we stored in the session
  if (state !== storedState) return false;

  // 2. Verify that the hmac is signed
  const searchParams = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (key !== "hmac") searchParams.append(key, value);
  }

  const localHmac = crypto
    .createHmac("sha256", process.env.API_SECRET_KEY!)
    .update(searchParams.toString())
    .digest("hex");

  const hmac = url.searchParams.get("hmac");

  if (localHmac !== hmac) return false;

  return true;
}

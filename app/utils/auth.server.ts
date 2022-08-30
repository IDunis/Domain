import type {
  LoginForm,
  RegisterForm
} from "./types.server";
import {
  redirect,
  json,
} from "@remix-run/node";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import {
  getSession,
  destroySession,
  getUserSession,
  commitSession,
} from "./session.server";
import { prisma } from "./prisma.server";
import { verifyShopifyRequest } from "./middlewares";

export const HOME_ROUTE = "/";

export async function register(userData: RegisterForm, redirectTo = HOME_ROUTE) {
  const userExists = await prisma.user.count({
    where: { username: userData.username }
  });

  if (userExists) {
    // return json({ error: `User already exists with that email` }, { status: 400 });
    return json({error: `User with username ${userData.username} already exists`}, { status: 400 });
  }

  const password = await bcrypt.hash(userData.password, 10)
  const newUser = await prisma.user.create({
    data: {
      username: userData.username,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: password,
    },
  });

  if (!newUser) {
    return json(
      {
        error: `Something went wrong trying to create a new user.`,
        fields: { email: userData.email, password: userData.password },
      },
      { status: 400 },
    );
  }

  return setCurrentUserId(newUser.id, redirectTo);
}

export async function login({ username, password }: LoginForm, redirectTo = HOME_ROUTE) {
  const userExists = await prisma.user.findUnique({
    where: { username },
  });

  console.log("user", userExists);
  if (!userExists || !(await bcrypt.compare(password, userExists.password))) {
    return json({ error: `Incorrect login` }, { status: 400 });
  }
  return setCurrentUserId(userExists.id, redirectTo);
}

export async function logout(request: Request) {
  return redirect("/login", {
    headers: {
      "Set-Cookie": await destroySession(
        await getUserSession(request)
      ),
    },
  });
}

async function setCurrentUserId(
  userId: string,
  redirectTo: string
) {
  const session = await getSession();
  session.set("userId", userId);

  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function getCurrentUserId(request: Request) {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") {
    return null;
  }  
  return userId;
}

export async function getUserFromShop(shopName: string) {
  try {
    const shop = await prisma.shop.findUnique({
      where: { name: shopName.replace(".myshopify.com", "") },
      include: { user: true }
    });
    console.log("shop", shop, shopName);
    return shop?.user;
  } catch {};

  return null;
}

export async function getAuthenticatedUser(request: Request) {
  const userId = await getCurrentUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    return await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });
  } catch {};

  return null;
}

export async function getShop(request: Request) {
  const session = await getUserSession(request);
  const shop = session.get("shop");
  
  if (!shop) return null;
  return shop;
}

export async function getAccessToken(request: Request) {
  const session = await getUserSession(request);
  const accessToken = session.get("accessToken");
  console.log("accessToken", accessToken)

  if (!accessToken || typeof accessToken !== "string") return null;
  return accessToken;
}

export async function requireAccessToken(request: Request) {
  const accessToken = await getAccessToken(request);
  if (!accessToken || typeof accessToken !== "string") throw redirect("/login");
  return accessToken;
}

export function nonce(): string {
  const length = 15;
  const bytes = crypto.randomBytes(length);

  const nonce = bytes
    .map((byte) => {
      return byte % 10;
    })
    .join("");

  return nonce;
}

export async function beginAuthShopify(request: Request, params: { shop: string }) {
  const { shop } = params;
  if (!shop) throw new Error('"shop" query param is required');

  const url = new URL(request.url);
  const session = await getSession();
  const state = nonce();
  session.set("state", state);

  const queryParams = new URLSearchParams({
    client_id: process.env.API_KEY!,
    scope: "read_products,write_products",
    redirect_uri: `https://${url.host}/auth/callback`,
    state,
    "grant_options[]": "per-user",
  });

  const query = decodeURIComponent(queryParams.toString());
  const authRoute = `https://${shop}.myshopify.com/admin/oauth/authorize?${query}`;
  return redirect(authRoute, {
    headers: {
      "Set-Cookie": await commitSession(session),
    },
  });
}

export async function handleShopifyCallback(request: Request) {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  const code = url.searchParams.get("code");
  if (!code) throw redirect("/");

  if (!(await verifyShopifyRequest(request))) {
    throw new Error("Security check failed");
  }

  const currUser = await getUserFromShop(shop as string);

  const params = new URLSearchParams([
    ["client_id", process.env.API_KEY || ""],
    ["client_secret", process.env.API_SECRET_KEY || ""],
    ["code", code],
  ]);

  try {
    const response = await fetch(
      `https://${shop}/admin/oauth/access_token?${params}`,
      {
        method: "POST",
      }
    );
    const json = await response.json();
    const session = await getUserSession(request);

    session.set("shop", shop);
    session.set("userId", currUser?.id);
    session.set("accessToken", json.access_token);

    // if (currUser) {
    //   return setCurrentUserId(currUser?.id, "/jokes");
    // }

    return redirect("/jokes", {
      headers: {
        "Set-Cookie": await commitSession(session),
      },
    });
  } catch (error) {
    throw error;
  }
}
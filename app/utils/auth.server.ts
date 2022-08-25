import type { LoginForm, RegisterForm } from "./types.server";
import {
  redirect,
  json,
} from "@remix-run/node";
import bcrypt from "bcryptjs";
import {
  getUserId,
  createUserSession,
  destroyUserSession,
} from "./session.server";
import { db } from "./db.server";
import { createUser } from "./users.server";

export const HOME_ROUTE = "/";
export const LOGIN_ROUTE = "/login";

export async function register(userData: RegisterForm, redirectTo = HOME_ROUTE) {
  const userExists = await db.user.count({ where: { username: userData.username } });
  if (userExists) {
    // return json({ error: `User already exists with that email` }, { status: 400 });
    return json({error: `User with username ${userData.username} already exists`}, { status: 400 });
  }

  const newUser = await createUser(userData);
  if (!newUser) {
    return json(
      {
        error: `Something went wrong trying to create a new user.`,
        fields: { email: userData.email, password: userData.password },
      },
      { status: 400 },
    );
  }
  
  return createUserSession(newUser.id, redirectTo);
}

export async function login({ username, password }: LoginForm, redirectTo = HOME_ROUTE) {
  const user = await db.user.findUnique({
    where: { username },
  });

  console.log('user', user);
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return json({ error: `Incorrect login` }, { status: 400 });
  }

  return createUserSession(user.id, redirectTo);
}

export async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
) {
  const userId = await getUserId(request);
  
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([
      ["redirectTo", redirectTo],
    ]);
    
    throw redirect(`${LOGIN_ROUTE}?${searchParams}`);
  }
  
  return userId;
}

export async function getUser(request: Request) {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, username: true },
    });

    return user;
  } catch {
    throw logout(request);
  }
}

export async function logout(request: Request) {
  return redirect(LOGIN_ROUTE, {
    headers: {
      'Set-Cookie': await destroyUserSession(request),
    },
  });
}
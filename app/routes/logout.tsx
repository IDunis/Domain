import type {
  ActionFunction,
  LoaderFunction,
} from "@remix-run/node";
import { redirect } from "@remix-run/node";

import {
  logout,
  HOME_ROUTE,
} from "~/utils/auth.server";

export const action: ActionFunction = async ({ request }) => {
  return logout(request);
}

export const loader: LoaderFunction = async () => {
  return redirect(HOME_ROUTE);
}
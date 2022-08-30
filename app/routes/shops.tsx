import type {
  LinksFunction,
  LoaderFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  Link,
  Outlet,
  useLoaderData,
} from "@remix-run/react";
import stylesUrl from "~/styles/jokes.css";
import { getAuthenticatedUser } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

type LoaderData = {
  user: Awaited<ReturnType<typeof getAuthenticatedUser>>;
  items: Array<{ id: string; name: string, code: string, domain: string }>;
};

export const loader: LoaderFunction = async ({
  request,
}) => {
  const items = await prisma.shop.findMany({
    // take: 5,
    orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    select: { id: true, name: true },
  });
  
  const user = await getAuthenticatedUser(request);
  
  const data: LoaderData = {
    items,
    user,
  };
  
  return json(data);
};

export default function ShopsRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div className="jokes-layout">
      <header className="jokes-header">
        <div className="container">
          <h1 className="home-link">
            <Link
              to="/"
              title="Remix Shops"
              aria-label="Remix Shops"
            >
              <span className="logo">🤪</span>
              <span className="logo-medium">J🤪KES</span>
            </Link>
          </h1>
          {data.user ? (
            <div className="user-info">
              <span>{`Hi ${data.user.username}`}</span>
              <form action="/logout" method="post">
                <button type="submit" className="button">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </header>
      <main className="jokes-main">
        <div className="container">
          <div className="jokes-list">
            <Link to=".">Get a random shop</Link>
            <p>Here are a few more shops to check out:</p>
            <ul>
              {data.items.map((shop) => (
                <li key={shop.id}>
                  <Link to={shop.id}>{shop.name}</Link>
                </li>
              ))}
            </ul>
            <Link to="new" className="button">
              Add your own
            </Link>
          </div>
          <div className="jokes-outlet">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
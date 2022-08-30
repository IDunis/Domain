import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useCatch,
  Link,
} from "@remix-run/react";
import type { Shop } from "@prisma/client";

import { prisma } from "~/utils/prisma.server";

type LoaderData = { randomShop: Shop };

export const loader: LoaderFunction = async () => {
  const count = await prisma.shop.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomShop] = await prisma.shop.findMany({
    take: 1,
    skip: randomRowNumber,
  });
  if (!randomShop) {
    throw new Response("No random shop found", { status: 404 });
  }
  const data: LoaderData = { randomShop };
  return json(data);
};

export default function ShopsIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's a random shop:</p>
      <Link to={data.randomShop.id}>
        "{data.randomShop.name}" Permalink
      </Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        There are no shops to display.
      </div>
    );
  }
  throw new Error(
    `Unexpected caught response with status: ${caught.status}`
  );
}

export function ErrorBoundary() {
  return (
    <div className="error-container">
      I did a whoopsies.
    </div>
  );
}
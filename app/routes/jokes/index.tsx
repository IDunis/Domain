import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useCatch,
  Link,
} from "@remix-run/react";
import type { Joke } from "@prisma/client";

import { prisma } from "~/utils/prisma.server";
import { getShop, requireAccessToken } from "~/utils/auth.server";

const query = `
{
  products(first: 5) {
    edges {
      node {
        id
        handle
        title
        description
      }
    }
    pageInfo {
      hasNextPage
    }
  }
}
`;

type LoaderData = { randomJoke: Joke, products: any };

export const loader: LoaderFunction = async ({ request }) => {
  const count = await prisma.joke.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomJoke] = await prisma.joke.findMany({
    take: 1,
    skip: randomRowNumber,
  });
  if (!randomJoke) {
    throw new Response("No random joke found", { status: 404 });
  }
  
  const accessToken = await requireAccessToken(request);
  const shop = await getShop(request);
  try {
    const response = await fetch(
      `https://${shop}/admin/api/2022-01/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/graphql",
          "X-Shopify-Access-Token": accessToken,
        },
        body: query,
      }
    );
    const res = await response.json();
    const {
      data: {
        products: { edges },
      },
    } = res;
    return { randomJoke, products: edges };
  } catch (e) {
    return json({});
  }
  // const data: LoaderData = { randomJoke, edges };
  // return json(data);
};

export default function JokesIndexRoute() {
  const data = useLoaderData<LoaderData>();
  console.log(data);

  return (
    <div>
      <p>Here's a random joke:</p>
      <ul>
      {data.products.map(({ node: product }: any) => (
        <li key={product.id}>
          <Link to={product.id}>{product.title}</Link>
        </li>
      ))}
      </ul>
      <p>{data.randomJoke.content}</p>
      <Link to={data.randomJoke.id}>
        "{data.randomJoke.name}" Permalink
      </Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        There are no jokes to display.
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
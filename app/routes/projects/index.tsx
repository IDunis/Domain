import type { LoaderFunction } from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useLoaderData,
  useCatch,
  Link,
} from "@remix-run/react";
import type { Project } from "@prisma/client";

import { prisma } from "~/utils/prisma.server";

type LoaderData = { randomProject: Project };

export const loader: LoaderFunction = async () => {
  const count = await prisma.project.count();
  const randomRowNumber = Math.floor(Math.random() * count);
  const [randomProject] = await prisma.project.findMany({
    take: 1,
    skip: randomRowNumber,
  });
  if (!randomProject) {
    throw new Response("No random project found", { status: 404 });
  }
  const data: LoaderData = { randomProject };
  return json(data);
};

export default function ProjectsIndexRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <div>
      <p>Here's a random project:</p>
      <p>{data.randomProject.code}</p>
      <Link to={data.randomProject.id}>
        "{data.randomProject.name}" Permalink
      </Link>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 404) {
    return (
      <div className="error-container">
        There are no projects to display.
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
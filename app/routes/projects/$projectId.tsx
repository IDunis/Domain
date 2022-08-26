import type {
  LoaderFunction,
  ActionFunction,
  MetaFunction,
} from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  useCatch,
  useParams,
} from "@remix-run/react";
import type { Project } from "@prisma/client";
import { prisma } from "~/utils/prisma.server";
import { requireUserId } from "~/utils/auth.server";
import { ProjectDisplay } from "~/components/project";
import { getUserId } from "~/utils/session.server";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No project",
      description: "No project found",
    };
  }

  return {
    title: `"${data.project.name}" project`,
    description: `Enjoy the "${data.project.name}" project and much more and more`,
  };
};

type LoaderData = { project: Project; isOwner: boolean };

export const loader: LoaderFunction = async ({
  request,
  params,
}) => {
  // const userId = await requireUserId(request);
  const userId = await getUserId(request);

  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: { user: true }
  });
  if (!project) {
    throw new Response("What a project! Not found.", { status: 404 });
  }

  const data: LoaderData = {
    project,
    isOwner: userId === project.userId,
  };
  return json(data);
};

export const action: ActionFunction = async ({
  request,
  params,
}) => {
  const form = await request.formData();
  if (form.get("_method") !== "delete") {
    throw new Response(`The _method ${form.get("_method")} is not supported`, { status: 400 });
  }
  const userId = await requireUserId(request);
  const project = await prisma.project.findUnique({
    where: { id: params.projectId },
    include: { user: true }
  });
  if (!project) {
    throw new Response("Can't delete what does not exist", { status: 404 });
  }
  if (project.userId !== userId) {
    throw new Response("Pssh, nice try. That's not your project", { status: 401 });
  }

  await prisma.project.delete({ where: { id: params.projectId } });
  return redirect("/projects");
};

export default function ProjectRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <ProjectDisplay project={data.project} isOwner={data.isOwner} />
  );
}

export function CatchBoundary() {
  const caught = useCatch();
  const params = useParams();
  
  switch (caught.status) {
    case 400: {
      return (
        <div className="error-container">
          What you're trying to do is not allowed.
        </div>
      );
    }
    case 404: {
      return (
        <div className="error-container">
          Huh? What the heck is {params.projectId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.projectId} is not your project.
        </div>
      );
    }
    default: {
      throw new Error(`Unhandled error: ${caught.status}`);
    }
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  const { projectId } = useParams();
  return (
    <div className="error-container">{`There was an error loading project by the id ${projectId}. Sorry.`}</div>
  );
}
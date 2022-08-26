import { Link, Form } from "@remix-run/react";
import type { Project } from "@prisma/client";

export function ProjectDisplay({
  project,
  isOwner,
  canDelete = true,
}: {
  project: Project;//Pick<Project, "domain" | "name" | "code" | "locales">;
  isOwner: boolean;
  canDelete?: boolean;
}) {
  const { name, domain, user }: any = project;

  return (
    <div>
      <p>{name}</p>
      <p>{domain}</p>
      <p>{user.firstName} {user.lastName}</p>
      {isOwner ? (
        <Form method="post">
          <input
            type="hidden"
            name="_method"
            value="delete"
          />
          <button
            type="submit"
            className="button"
            disabled={!canDelete}
          >
            Delete
          </button>
        </Form>
      ) : null}
    </div>
  );
}
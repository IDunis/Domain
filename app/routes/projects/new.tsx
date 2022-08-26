import type {
  ActionFunction,
  LoaderFunction,
} from "@remix-run/node";
import { redirect, json } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useTransition,
} from "@remix-run/react";

import { ProjectDisplay } from "~/components/project";
import {
  requireUserId,
  getUser,
} from "~/utils/auth.server";
import { createProject } from "~/utils/projects.server";

function validateProjectDomain(content: string) {
  if (content.length < 10) {
    return `That domain is too short`;
  }
}

function validateProjectName(name: string) {
  if (name.length < 3) {
    return `That project's name is too short`;
  }
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name: string | undefined;
    domain: string | undefined;
  };
  fields?: {
    name: string;
    domain: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const loader: LoaderFunction = async ({
  request,
}) => {
  const user = await getUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name") as string;
  const code = form.get("code") || name.toUpperCase().replace(' ', '-');
  const domain = form.get("domain") as string;
  const locales = form.get("locales") as string || "en";

  if (
    typeof name !== "string" ||
    typeof domain !== "string"
  ) {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  const fieldErrors = {
    name: validateProjectName(name),
    domain: validateProjectDomain(domain),
  };

  const fields = { name, domain, code, locales };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const project = await createProject({ ...fields, userId });
  
  return redirect(`/projects/${project.id}`);
};

export default function NewProjectRoute() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission) {
    const name = transition.submission.formData.get("name");
    const domain = transition.submission.formData.get("content");
    const code = (name as string).toUpperCase().replace(" ", "-");
    const locales = transition.submission.formData.get("locales") as string || "en";
    
    if (
      typeof name === "string" &&
      typeof domain === "string" &&
      !validateProjectDomain(domain) &&
      !validateProjectName(name)
    ) {
      return (
        <ProjectDisplay
          project={{ name, domain, code, locales }}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }

  return (
    <div>
      <p>Add your own hilarious project</p>
      <Form method="post">
        <div>
          <label>
            Name:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.name}
              name="name"
              aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
              aria-errormessage={actionData?.fieldErrors?.name ? "name-error" : undefined}
            />
          </label>
          {actionData?.fieldErrors?.name ? (
            <p
              className="form-validation-error"
              role="alert"
              id="name-error"
            >
              {actionData.fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            Domain:{" "}
            <textarea
              defaultValue={actionData?.fields?.domain}
              name="domain"
              aria-invalid={Boolean(actionData?.fieldErrors?.domain) || undefined}
              aria-errormessage={actionData?.fieldErrors?.domain ? "domain-error" : undefined}
            />
          </label>
          {actionData?.fieldErrors?.domain ? (
            <p
              className="form-validation-error"
              role="alert"
              id="domain-error"
            >
              {actionData.fieldErrors.domain}
            </p>
          ) : null}
        </div>
        <div>
          {actionData?.formError ? (
            <p
              className="form-validation-error"
              role="alert"
            >
              {actionData.formError}
            </p>
          ) : null}
          <button type="submit" className="button">
            Add
          </button>
        </div>
      </Form>
    </div>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  if (caught.status === 401) {
    return (
      <div className="error-container">
        <p>You must be logged in to create a project.</p>
        <Link to="/login">Login</Link>
      </div>
    );
  }
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <div className="error-container">
      Something unexpected went wrong. Sorry about that.
    </div>
  );
}
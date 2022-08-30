import type {
  ActionFunction,
  LoaderFunction,
} from "@remix-run/node";
import {
  redirect,
  json
} from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useCatch,
  useTransition,
} from "@remix-run/react";

import { ShopDisplay } from "~/components/shop";
import { getAuthenticatedUser } from "~/utils/auth.server";
import { requireUserId } from "~/utils/middlewares";
import { prisma } from "~/utils/prisma.server";

function validateShopName(name: string) {
  if (name.length < 3) {
    return `That project's name is too short`;
  }
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    name?: string;
    access?: string;
    secret?: string;
  };
  fields?: {
    name?: string;
    access?: string;
    secret?: string;
  };
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const loader: LoaderFunction = async ({
  request,
}) => {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Response("Unauthorized", { status: 401 });
  }
  
  return json({});
};

export const action: ActionFunction = async ({ request }) => {
  const userId = await requireUserId(request);
  const form = await request.formData();
  const name = form.get("name") as string;
  const access = form.get("access") as string;
  const secret = form.get("secret") as string;

  if (typeof name !== "string") {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  const fieldErrors = {
    name: validateShopName(name),
    access: validateShopName(access),
    secret: validateShopName(secret),
  };

  const fields = { name, access, secret };
  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  const shop = await prisma.shop.create({
    data: { ...fields, userId },
  });
  
  return redirect(`/shops/${shop.id}`);
};

export default function NewShopRoute() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();

  if (transition.submission) {
    const name = transition.submission.formData.get("name");
    
    if (
      typeof name === "string" &&
      !validateShopName(name)
    ) {
      return (
        <ShopDisplay
          shop={{ name }}
          isOwner={true}
          canDelete={false}
        />
      );
    }
  }

  return (
    <div>
      <p>Add your own hilarious shop</p>
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
            API KEY:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.access}
              name="access"
              aria-invalid={Boolean(actionData?.fieldErrors?.access) || undefined}
              aria-errormessage={actionData?.fieldErrors?.access ? "access-error" : undefined}
            />
          </label>
          {actionData?.fieldErrors?.access ? (
            <p
              className="form-validation-error"
              role="alert"
              id="access-error"
            >
              {actionData.fieldErrors.access}
            </p>
          ) : null}
        </div>
        <div>
          <label>
            API SECRET KEY:{" "}
            <input
              type="text"
              defaultValue={actionData?.fields?.secret}
              name="secret"
              aria-invalid={Boolean(actionData?.fieldErrors?.secret) || undefined}
              aria-errormessage={actionData?.fieldErrors?.secret ? "secret-error" : undefined}
            />
          </label>
          {actionData?.fieldErrors?.secret ? (
            <p
              className="form-validation-error"
              role="alert"
              id="secret-error"
            >
              {actionData.fieldErrors.secret}
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
        <p>You must be logged in to create a shop.</p>
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
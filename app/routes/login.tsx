import type {
  ActionFunction,
  LinksFunction,
  MetaFunction,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useActionData,
  useSearchParams,
  Link,
} from "@remix-run/react";

import { db } from "~/utils/db.server";
import {
  createUserSession,
  // login,
  // register,
} from "~/utils/session.server";
import { login, register } from "~/utils/auth.server";
import {
  validateEmail,
  validateName,
  validateUsername,
  validatePassword,
} from "~/utils/validators.server";
import stylesUrl from "~/styles/login.css";

export const links: LinksFunction = () => {
  return [{ rel: "stylesheet", href: stylesUrl }];
};

export const meta: MetaFunction = () => {
  return {
    title: "Remix Jokes | Login",
    description:
      "Login to submit your own jokes to Remix Jokes!",
  };
};

// function validateUsername(username: unknown) {
//   if (typeof username !== "string" || username.length < 3) {
//     return `Username must be at least 3 characters long`;
//   }
// }

// function validatePassword(password: unknown) {
//   if (typeof password !== "string" || password.length < 6) {
//     return `Password must be at least 6 characters long`;
//   }
// }

function validateUrl(url: any) {
  let urls = ["/jokes", "/", "https://remix.run"];
  if (urls.includes(url)) {
    return url;
  }
  return "/jokes";
}

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username: string | undefined;
    password: string | undefined;
    email: unknown;
    firstName: unknown;
    lastName: unknown;
  };
  fields?: {
    loginType: string;
    username: string;
    password: string;
    email: unknown;
    firstName: unknown;
    lastName: unknown;
  };
};

const badRequest = (data: ActionData) =>
  json(data, { status: 400 });

export const action: ActionFunction = async ({
  request,
}) => {
  const form = await request.formData();
  const loginType = form.get("loginType");
  const username = form.get("username");
  const password = form.get("password");
  const email = form.get("email");
  const firstName = form.get("firstName");
  const lastName = form.get("lastName");
  const redirectTo = validateUrl(
    form.get("redirectTo") || "/jokes"
  );
  if (
    typeof loginType !== "string" ||
    typeof username !== "string" ||
    typeof password !== "string" ||
    typeof redirectTo !== "string"
  ) {
    return badRequest({
      formError: `Form not submitted correctly.`,
    });
  }
  
  let fields = {};
  let fieldErrors = {}
  if (loginType === "register") {
    fields = { loginType, username, password, email, firstName, lastName };
    fieldErrors = {
      username: validateUsername(username),
      password: validatePassword(password),
      email: validateEmail(email),
      firstName: validateName(firstName),
      lastName: validateName(lastName),
    };
  } else {
    fields = { loginType, username, password };
    fieldErrors = {
      username: validateUsername(username),
      password: validatePassword(password),
    };
  }

  
  if (Object.values(fieldErrors).some(Boolean))
    return badRequest({ fieldErrors, fields });

  switch (loginType) {
    case "login": {
      const user = await login({ username, password });
      return user;
      // if (!user) {
      //   return badRequest({
      //     fields,
      //     formError: `Username/Password combination is incorrect`,
      //   });
      // }
      // return createUserSession(user.id, redirectTo);
    }
    case "register": {
      const userExists = await db.user.findFirst({
        where: { username },
      });
      if (userExists) {
        return badRequest({
          fields,
          formError: `User with username ${username} already exists`,
        });
      }
      const user = await register({ username, password, email, firstName, lastName });
      return user;
      // if (!user) {
      //   return badRequest({
      //     fields,
      //     formError: `Something went wrong trying to create a new user.`,
      //   });
      // }
      // return createUserSession(user.id, redirectTo);
    }
    default: {
      return badRequest({
        fields,
        formError: `Login type invalid`,
      });
    }
  }
};

export default function Login() {
  const actionData = useActionData<ActionData>();
  const [searchParams] = useSearchParams();
  return (
    <div className="container">
      <div className="content" data-light="">
        <h1>Login</h1>
        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={
              searchParams.get("redirectTo") ?? undefined
            }
          />
          <fieldset>
            <legend className="sr-only">
              Login or Register?
            </legend>
            <label>
              <input
                type="radio"
                name="loginType"
                value="login"
                defaultChecked={
                  !actionData?.fields?.loginType ||
                  actionData?.fields?.loginType === "login"
                }
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={
                  actionData?.fields?.loginType ===
                  "register"
                }
              />{" "}
              Register
            </label>
          </fieldset>
          <div>
            <label htmlFor="username-input">Username</label>
            <input
              type="text"
              id="username-input"
              name="username"
              defaultValue={actionData?.fields?.username}
              aria-invalid={Boolean(
                actionData?.fieldErrors?.username
              )}
              aria-errormessage={
                actionData?.fieldErrors?.username
                  ? "username-error"
                  : undefined
              }
            />
            {actionData?.fieldErrors?.username ? (
              <p
                className="form-validation-error"
                role="alert"
                id="username-error"
              >
                {actionData.fieldErrors.username}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              type="password"
              aria-invalid={
                Boolean(
                  actionData?.fieldErrors?.password
                ) || undefined
              }
              aria-errormessage={
                actionData?.fieldErrors?.password
                  ? "password-error"
                  : undefined
              }
            />
            {actionData?.fieldErrors?.password ? (
              <p
                className="form-validation-error"
                role="alert"
                id="password-error"
              >
                {actionData.fieldErrors.password}
              </p>
            ) : null}
          </div>
          {actionData?.fields?.loginType === "register" && (
            <>
              <div>
              <label htmlFor="password-input">Email</label>
              <input
                id="password-input"
                name="email"
                defaultValue={actionData?.fields?.email}
                type="email"
                aria-invalid={
                  Boolean(
                    actionData?.fieldErrors?.email
                  ) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.email
                    ? "email-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.email ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="email-error"
                >
                  {actionData.fieldErrors.email}
                </p>
              ) : null}
            </div>
          </>
          )}
          {actionData?.fields?.loginType === "register" && (
            <>
              <div>
              <label htmlFor="firstName-input">First Name</label>
              <input
                id="firstName-input"
                name="firstName"
                defaultValue={actionData?.fields?.firstName}
                type="text"
                aria-invalid={
                  Boolean(
                    actionData?.fieldErrors?.firstName
                  ) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.firstName
                    ? "firstName-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.firstName ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="firstName-error"
                >
                  {actionData.fieldErrors.firstName}
                </p>
              ) : null}
            </div>
          </>
          )}
          {actionData?.fields?.loginType === "register" && (
            <>
              <div>
              <label htmlFor="lastName-input">Last Name</label>
              <input
                id="lastName-input"
                name="lastName"
                defaultValue={actionData?.fields?.lastName}
                type="text"
                aria-invalid={
                  Boolean(
                    actionData?.fieldErrors?.lastName
                  ) || undefined
                }
                aria-errormessage={
                  actionData?.fieldErrors?.lastName
                    ? "lastName-error"
                    : undefined
                }
              />
              {actionData?.fieldErrors?.lastName ? (
                <p
                  className="form-validation-error"
                  role="alert"
                  id="lastName-error"
                >
                  {actionData.fieldErrors.lastName}
                </p>
              ) : null}
            </div>
          </>
          )}
          <div id="form-error-message">
            {actionData?.formError ? (
              <p
                className="form-validation-error"
                role="alert"
              >
                {actionData.formError}
              </p>
            ) : null}
          </div>
          <button type="submit" className="button">
            Submit
          </button>
        </form>
      </div>
      <div className="links">
        <ul>
          <li>
            <Link to="/">Home</Link>
          </li>
          <li>
            <Link to="/jokes">Jokes</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
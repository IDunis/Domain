import {
  ActionFunction,
  LoaderFunction,
  LinksFunction,
  MetaFunction,
  redirect,
} from "@remix-run/node";
import { json } from "@remix-run/node";
import {
  useActionData,
  useTransition,
  useSearchParams,
  Link,
} from "@remix-run/react";

import { db } from "~/utils/db.server";
import {
  HOME_ROUTE,
  getUser,
  login,
  register,
} from "~/utils/auth.server";
import {
  validateEmail,
  validateName,
  validateUsername,
  validatePassword,
  validateUrl,
} from "~/utils/validators.server";
import stylesUrl from "~/styles/login.css";
import { useEffect, useRef, useState } from "react";

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

// function validateUrl(url: any) {
//   let urls = ["/jokes", "/", "https://remix.run"];
//   if (urls.includes(url)) {
//     return url;
//   }

//   return "/jokes";
// }

type ActionData = {
  formError?: string;
  fieldErrors?: {
    username?: string;
    password?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  fields?: {
    loginType?: string;
    username?: string;
    password?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
};

enum FormType {
  REGISTER = "register",
  LOGIN = "login"
};

const badRequest = (data: ActionData) => json(data, { status: 400 });

export const loader: LoaderFunction = async ({ request }) => {
  // If there's already a user in the session, redirect to the home page
  return await getUser(request) ? redirect(HOME_ROUTE) : null
}

export const action: ActionFunction = async ({ request }) => {
  const form = await request.formData();
  const loginType = form.get("loginType") as string;
  const username = form.get("username") as string;
  const password = form.get("password") as string;
  const email = form.get("email") as string;
  const firstName = form.get("firstName") as string;
  const lastName = form.get("lastName") as string;
  // const redirectTo = validateUrl(form.get("redirectTo") as string || HOME_ROUTE);
  const redirectTo = form.get("redirectTo") as string || HOME_ROUTE;

  if (
    typeof loginType !== "string"
    || typeof username !== "string"
    || typeof password !== "string"
  ) {
    return badRequest({ formError: `Form not submitted correctly.` });
  }

  if (
    loginType === FormType.REGISTER
    && (
      typeof email !== "string"
      || typeof firstName !== "string"
      || typeof lastName !== "string"
    )
  ) {
    return badRequest({ formError: `Form not submitted correctly.` });
  }
  
  const fields = {
    loginType,
    username,
    password,
    ...(loginType === FormType.REGISTER ? {
      email,
      firstName,
      lastName,
    } : {})
  };

  const fieldErrors = {
    username: validateUsername(username),
    password: validatePassword(password),
    ...(loginType === FormType.REGISTER ? {
      email: validateEmail(email),
      firstName: validateName(firstName),
      lastName: validateName(lastName),
    } : {})    
  };
  // let fields = {};
  // let fieldErrors = {};
  // if (loginType === FormType.REGISTER) {
  //   fields = { loginType, username, password, email, firstName, lastName };
  //   fieldErrors = {
  //     username: validateUsername(username),
  //     password: validatePassword(password),
  //     email: validateEmail(email),
  //     firstName: validateName(firstName),
  //     lastName: validateName(lastName),
  //   };
  // } else {
  //   fields = { loginType, username, password };
  //   fieldErrors = {
  //     username: validateUsername(username),
  //     password: validatePassword(password),
  //   };
  // }

  if (Object.values(fieldErrors).some(Boolean)) {
    return badRequest({ fieldErrors, fields });
  }

  switch (loginType) {
    case FormType.LOGIN: {
      return await login({ username, password }, redirectTo);
      // if (!user) {
      //   return badRequest({
      //     fields,
      //     formError: `Username/Password combination is incorrect`,
      //   });
      // }
      // return createUserSession(user.id, redirectTo);
    }
    case FormType.REGISTER: {
      // const userExists = await db.user.findFirst({ where: { username } });
      // if (userExists) {
      //   return badRequest({
      //     fields,
      //     formError: `User with username ${username} already exists`,
      //   });
      // }
      return await register({ username, password, email, firstName, lastName }, redirectTo);
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

function ValidationForm({ error, isSubmitting }: any) {
  const [show, setShow] = useState(!!error);
  
  useEffect(() => {
    const id = setTimeout(() => {
      const hasError = !!error;
      setShow(hasError && !isSubmitting);
    });
    return () => clearTimeout(id);
  }, [error, isSubmitting]);

  return (
    <div id="form-error-message">
      <p
        className="form-validation-error"
        role="alert"
      >
        {error}
      </p>
    </div>
  );
}

function ValidationMessage({ error, isSubmitting }: any) {
  const [show, setShow] = useState(!!error);

  useEffect(() => {
    const id = setTimeout(() => {
      const hasError = !!error;
      setShow(hasError && !isSubmitting);
    });
    return () => clearTimeout(id);
  }, [error, isSubmitting]);

  return (
    <p
      className="form-validation-error"
      role="alert"
      style={{
        opacity: show ? 1 : 0
      }}
    >
      {error}
    </p>
  );
}

export default function Login() {
  const actionData = useActionData<ActionData>();
  const transition = useTransition();
  const [searchParams] = useSearchParams();
  const firstLoad = useRef(true);

  const [action, setAction] = useState(actionData?.fields?.loginType || FormType.LOGIN);
  const [errors, setErrors] = useState(actionData?.fieldErrors || {})

  useEffect(() => {
    if (!firstLoad.current) {
      setErrors({});
    }
  }, [action]);

  useEffect(() => {
    // We don't want to reset errors on page load because we want to see them
    firstLoad.current = false
  }, []);

  return (
    <div className="container">
      <div className="content" data-light="">
        <h1 style={{textTransform: "uppercase"}}>{action === FormType.LOGIN ? FormType.LOGIN : FormType.REGISTER}</h1>
        <form method="post">
          <input
            type="hidden"
            name="redirectTo"
            value={searchParams.get("redirectTo") ?? undefined}
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
                defaultChecked={action === FormType.LOGIN}
                onChange={() => setAction(FormType.LOGIN)}
              />{" "}
              Login
            </label>
            <label>
              <input
                type="radio"
                name="loginType"
                value="register"
                defaultChecked={action === FormType.REGISTER}
                onChange={() => setAction(FormType.REGISTER)}
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
              aria-invalid={Boolean(errors?.username)}
              aria-errormessage={errors?.username ? "username-error" : undefined}
            />
            {errors?.username ? (
              <ValidationMessage
                isSubmitting={transition.state === "submitting"}
                error={errors?.username}
              />
            ) : null}
          </div>
          <div>
            <label htmlFor="password-input">Password</label>
            <input
              id="password-input"
              name="password"
              defaultValue={actionData?.fields?.password}
              type="password"
              aria-invalid={Boolean(errors?.password) || undefined}
              aria-errormessage={errors?.password ? "password-error" : undefined}
            />            
            {errors?.password ? (
              <ValidationMessage
                isSubmitting={transition.state === "submitting"}
                error={errors?.password}
              />
            ) : null}
          </div>
          {action === FormType.REGISTER && (
            <>
              <div>
              <label htmlFor="password-input">Email</label>
              <input
                id="password-input"
                name="email"
                defaultValue={actionData?.fields?.email}
                type="email"
                aria-invalid={Boolean(errors?.email) || undefined}
                aria-errormessage={errors?.email ? "email-error" : undefined}
              />            
              {errors?.email ? (
                <ValidationMessage
                  isSubmitting={transition.state === "submitting"}
                  error={errors?.email}
                />
              ) : null}
            </div>
          </>
          )}
          {action === FormType.REGISTER && (
            <>
              <div>
              <label htmlFor="firstName-input">First Name</label>
              <input
                id="firstName-input"
                name="firstName"
                defaultValue={actionData?.fields?.firstName}
                type="text"
                aria-invalid={Boolean(errors?.firstName) || undefined}
                aria-errormessage={errors?.firstName ? "firstName-error" : undefined}
              />            
              {errors?.firstName ? (
                <ValidationMessage
                  isSubmitting={transition.state === "submitting"}
                  error={errors?.firstName}
                />
              ) : null}
            </div>
          </>
          )}
          {action === FormType.REGISTER && (
            <>
              <div>
              <label htmlFor="lastName-input">Last Name</label>
              <input
                id="lastName-input"
                name="lastName"
                defaultValue={actionData?.fields?.lastName}
                type="text"
                aria-invalid={Boolean(errors?.lastName) || undefined}
                aria-errormessage={errors?.lastName ? "lastName-error" : undefined}
              />            
              {errors?.lastName ? (
                <ValidationMessage
                  isSubmitting={transition.state === "submitting"}
                  error={errors?.lastName}
                />
              ) : null}
            </div>
          </>
          )}            
          {actionData?.formError ? (
            <ValidationForm
              isSubmitting={transition.state === "submitting"}
              error={actionData?.formError}
            />
          ) : null}
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
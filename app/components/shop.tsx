import { Link, Form } from "@remix-run/react";
import type { Shop } from "@prisma/client";
import { redirect } from "@remix-run/node";

export function ShopDisplay({
  shop,
  isOwner,
  canDelete = true,
}: {
  shop: Shop;//Pick<Project, "domain" | "name" | "code" | "locales">;
  isOwner: boolean;
  canDelete?: boolean;
}) {
  const { name }: any = shop;

  return (
    <div>
      <p>{name}
          {isOwner ? (
            <Link to={`/login/initialize/${name}`}>JOIN NOW!</Link>
          ) : null}
      </p>
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
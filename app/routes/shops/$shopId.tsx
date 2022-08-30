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
import type { Shop } from "@prisma/client";
import { getCurrentUserId } from "~/utils/auth.server";
import { prisma } from "~/utils/prisma.server";
import { requireUserId } from "~/utils/middlewares";
import { ShopDisplay } from "~/components/shop";

export const meta: MetaFunction = ({
  data,
}: {
  data: LoaderData | undefined;
}) => {
  if (!data) {
    return {
      title: "No shop",
      description: "No shop found",
    };
  }

  return {
    title: `"${data.shop.name}" shop`,
    description: `Enjoy the "${data.shop.name}" shop and much more and more`,
  };
};

type LoaderData = { project: Shop; isOwner: boolean };

export const loader: LoaderFunction = async ({
  request,
  params,
}) => {
  // const userId = await requireUserId(request);
  const userId = await getCurrentUserId(request);
  const shop = await prisma.shop.findUnique({
    where: { id: params.shopId },
    include: { user: true }
  });

  if (!shop) {
    throw new Response("What a shop! Not found.", { status: 404 });
  }

  const data: LoaderData = {
    shop,
    isOwner: userId === shop.userId,
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
  const shop = await prisma.shop.findUnique({
    where: { id: params.shopId },
    include: { user: true }
  });

  if (!shop) {
    throw new Response("Can't delete what does not exist", { status: 404 });
  }

  if (shop.userId !== userId) {
    throw new Response("Pssh, nice try. That's not your shop", { status: 401 });
  }

  await prisma.shop.delete({ where: { id: params.shopId } });
  
  return redirect("/shops");
};

export default function ShopRoute() {
  const data = useLoaderData<LoaderData>();

  return (
    <ShopDisplay shop={data.shop} isOwner={data.isOwner} />
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
          Huh? What the heck is {params.shopId}?
        </div>
      );
    }
    case 401: {
      return (
        <div className="error-container">
          Sorry, but {params.shopId} is not your shop.
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

  const { shopId } = useParams();
  return (
    <div className="error-container">{`There was an error loading shop by the id ${shopId}. Sorry.`}</div>
  );
}
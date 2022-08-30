import { LoaderFunction } from "remix";
import { beginAuthShopify } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request, params }: any) => {
  const shop = params.shop;

  if (!shop) throw new Error("Shop is required");

  return await beginAuthShopify(request, { shop });
};

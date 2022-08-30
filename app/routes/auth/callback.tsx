import { LoaderFunction } from "remix";
import { handleShopifyCallback } from "~/utils/auth.server";

export const loader: LoaderFunction = async ({ request }: any) => {
  return await handleShopifyCallback(request);
};

export default function () {
  return (
    <div>
      <div>Callback</div>
    </div>
  );
}

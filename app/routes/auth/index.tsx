import { Outlet } from "@remix-run/react";

export default function () {
  return (
    <div>
      <div>Auth</div>
      <Outlet />
    </div>
  );
}

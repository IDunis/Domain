
 import React, { useContext, useEffect } from "react";
 import { withEmotionCache } from "@emotion/react";
 import {
  extendTheme,
  ChakraProvider,
  cookieStorageManagerSSR,
  localStorageManager
} from "@chakra-ui/react";
 import type {
  MetaFunction,
  LinksFunction,
  LoaderFunction,
 } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useCatch,
  useLoaderData,
} from "@remix-run/react";

import { ServerStyleContext, ClientStyleContext } from "./context";

import globalStylesUrl from "./styles/global.css";
import globalMediumStylesUrl from "./styles/global-medium.css";
import globalLargeStylesUrl from "./styles/global-large.css";

export const meta: MetaFunction = () => {
  const description = `Learn Remix and laugh at the same time!`;
  return {
    charset: "utf-8",
    description,
    keywords: "Remix,jokes",
    viewport: "width=device-width,initial-scale=1",
    "twitter:image": "https://remix-run.localhost/social.png",
    "twitter:card": "summary_large_image",
    "twitter:creator": "@remix_run",
    "twitter:site": "@remix_run",
    "twitter:title": "Remix Jokes",
    "twitter:description": description,
  };
};

export const links: LinksFunction = () => {
  return [
    { rel: "preconnect", href: "https://fonts.googleapis.com" },
    { rel: "preconnect", href: "https://fonts.gstatic.com" },
    { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500;1,600;1,700;1,800&display=swap" },
    // { rel: "stylesheet", href: globalStylesUrl },
    // { rel: "stylesheet", href: globalMediumStylesUrl, media: "print, (min-width: 640px)" },
    // { rel: "stylesheet", href: globalLargeStylesUrl, media: "screen and (min-width: 1024px)" },
  ];
};

interface DocumentProps {
  children: React.ReactNode;
  title?: string
}

const Document = withEmotionCache(
  ({ children, title }: DocumentProps, emotionCache) => {
    const serverStyleData = useContext(ServerStyleContext);
    const clientStyleData = useContext(ClientStyleContext);

    // Only executed on client
    useEffect(() => {
      // re-link sheet container
      emotionCache.sheet.container = document.head;
      // re-inject tags
      const tags = emotionCache.sheet.tags;
      emotionCache.sheet.flush();
      tags.forEach((tag) => {
        (emotionCache.sheet as any)._insertTag(tag);
      });
      // reset cache to reapply global styles
      clientStyleData?.reset();
    }, []);

    return (
      <html lang="en">
        <head>
          <Meta />
          {title ? (
            <title>{title}</title>
          ) : null}
          <Links />
          {serverStyleData?.map(({ key, ids, css }) => (
            <style
              key={key}
              data-emotion={`${key} ${ids.join(" ")}`}
              dangerouslySetInnerHTML={{ __html: css }}
            />
          ))}
        </head>
        <body>
          {children}
          <ScrollRestoration />
          <Scripts />
          <LiveReload />
        </body>
      </html>
    );
  }
);

const theme = extendTheme({
  brand: {
    900: "#1a365d",
    800: "#153e75",
    700: "#2a69ac",
  },
});

// This will return cookies 
export const loader: LoaderFunction = async ({ request }) => {
  // first time users will not have any cookies and you may not return
  // undefined here, hence ?? is necessary
    return request.headers.get("cookie") ?? ""
  };

export default function App() {
  const cookies = useLoaderData();

  return (
    <Document>
      <ChakraProvider
        theme={theme}
        colorModeManager={typeof cookies === "string"
          ? cookieStorageManagerSSR(cookies)
          : localStorageManager
        }
      >
        <Outlet />
      </ChakraProvider>
    </Document>
  );
}

export function CatchBoundary() {
  const caught = useCatch();

  return (
    <Document
      title={`${caught.status} ${caught.statusText}`}
    >
      <div className="error-container">
        <h1>
          {caught.status} {caught.statusText}
        </h1>
      </div>
    </Document>
  );
}

export function ErrorBoundary({ error }: { error: Error }) {
  console.error(error);

  return (
    <Document title="Uh-oh!">
      <div className="error-container">
        <h1>App Error</h1>
        <pre>{error.message}</pre>
      </div>
    </Document>
  );
}
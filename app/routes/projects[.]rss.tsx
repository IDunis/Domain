import type { LoaderFunction } from "@remix-run/node";

import { prisma } from "~/utils/prisma.server";

function escapeCdata(s: string) {
  return s.replace(/\]\]>/g, "]]]]><![CDATA[>");
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const loader: LoaderFunction = async ({ request }) => {
  const projects = await prisma.project.findMany({
    take: 100,
    orderBy: { createdAt: "desc" },
    include: { user: { select: { username: true } } },
  });

  const host =
    request.headers.get("X-Forwarded-Host") ??
    request.headers.get("host");
  if (!host) {
    throw new Error("Could not determine domain URL.");
  }
  const protocol = host.includes("localhost")
    ? "http"
    : "https";
  const domain = `${protocol}://${host}`;
  const projectsUrl = `${domain}/projects`;

  const rssString = `
    <rss xmlns:blogChannel="${projectsUrl}" version="2.0">
      <channel>
        <title>Remix Projects</title>
        <link>${projectsUrl}</link>
        <description>Some funny projects</description>
        <language>en-us</language>
        <generator>Kody the Koala</generator>
        <ttl>40</ttl>
        ${projects
          .map((project) =>
            `
            <item>
              <title><![CDATA[${escapeCdata(
                project.name
              )}]]></title>
              <description><![CDATA[A funny project called ${escapeHtml(
                project.name
              )}]]></description>
              <author><![CDATA[${escapeCdata(
                project.user.username
              )}]]></author>
              <pubDate>${project.createdAt.toUTCString()}</pubDate>
              <link>${projectsUrl}/${project.id}</link>
              <guid>${projectsUrl}/${project.id}</guid>
            </item>
          `.trim()
          )
          .join("\n")}
      </channel>
    </rss>
  `.trim();

  return new Response(rssString, {
    headers: {
      "Cache-Control": `public, max-age=${
        60 * 10
      }, s-maxage=${60 * 60 * 24}`,
      "Content-Type": "application/xml",
      "Content-Length": String(
        Buffer.byteLength(rssString)
      ),
    },
  });
};
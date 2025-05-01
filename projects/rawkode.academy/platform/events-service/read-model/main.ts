import { useSentry } from "@envelop/sentry";
import {
  createRemoteJwksSigningKeyProvider,
  extractFromHeader,
  useJWT,
} from "@graphql-yoga/plugin-jwt";
import * as Sentry from "@sentry/deno";
import "@sentry/tracing";
import { createYoga } from "graphql-yoga";
import { getSchema } from "./schema.ts";
import { db } from "../data-model/client.ts";
import { eventsTable } from "../data-model/schema.ts";
import { eq } from "drizzle-orm";

if (Deno.env.get("SENTRY_DSN")) {
  Sentry.init({
    dsn: Deno.env.get("SENTRY_DSN"),
    environment: "production",
    tracesSampleRate: 1.0,
  });

  console.debug("Sentry is enabled");
}

interface Event {
  id: string;
  type: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  attendeeLimit: number | null;
  url: string | null;
  status: string;
  originalStartDate: string | null;
  originalEndDate: string | null;
  technologyIds: string;
  location?: string;
}

function generateICal(event: Event) {
  let ical = "BEGIN:VCALENDAR\r\n";
  ical += "VERSION:2.0\r\n";
  ical += "PRODID:-//Rawkode Academy//Events//EN\r\n";
  ical += "CALSCALE:GREGORIAN\r\n";
  ical += "METHOD:PUBLISH\r\n";

  ical += "BEGIN:VEVENT\r\n";
  ical += `UID:${event.id}@rawkode.academy\r\n`;
  ical += `DTSTAMP:${
    new Date().toISOString().replace(/[-:]/g, "").split(".")[0]
  }Z\r\n`;
  ical += `DTSTART:${
    new Date(event.startDate).toISOString().replace(/[-:]/g, "").split(".")[0]
  }Z\r\n`;
  ical += `DTEND:${
    new Date(event.endDate).toISOString().replace(/[-:]/g, "").split(".")[0]
  }Z\r\n`;
  ical += `SUMMARY:${event.title}\r\n`;
  ical += `DESCRIPTION:${event.description}\r\n`;
  if (event.location) {
    ical += `LOCATION:${event.location}\r\n`;
  }
  if (event.url) {
    ical += `URL:${event.url}\r\n`;
  }
  ical += `STATUS:${event.status.toUpperCase()}\r\n`;
  ical += "END:VEVENT\r\n";

  ical += "END:VCALENDAR\r\n";
  return ical;
}

const yoga = createYoga({
  schema: getSchema(),
  graphqlEndpoint: "/",
  plugins: [
    useSentry({
      includeRawResult: false,
      includeExecuteVariables: true,
    }),
    useJWT({
      singingKeyProviders: [
        createRemoteJwksSigningKeyProvider({
          jwksUri: "https://zitadel.rawkode.academy/oauth/v2/keys",
        }),
      ],
      tokenLookupLocations: [
        extractFromHeader({ name: "authorization", prefix: "Bearer" }),
      ],
      extendContext: true,
      reject: {
        missingToken: false,
        invalidToken: false,
      },
    }),
  ],
});

const port = Deno.env.get("PORT") || "8000";

// Create a custom handler that includes both GraphQL and iCal endpoints
const handler = async (req: Request) => {
  const url = new URL(req.url);

  // Handle individual event iCal feed requests
  if (url.pathname.startsWith("/events/") && url.pathname.endsWith(".ics")) {
    const eventId = url.pathname.split("/")[2].replace(".ics", "");
    const event = await db.query.eventsTable.findFirst({
      where: eq(eventsTable.id, eventId),
    }).execute();

    if (!event) {
      return new Response("Event not found", { status: 404 });
    }

    const ical = generateICal(event);

    return new Response(ical, {
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename=${event.id}.ics`,
      },
    });
  }

  // Handle all other requests with GraphQL Yoga
  return yoga.fetch(req);
};

Deno.serve({
  port: Number(port),
  onListen: ({ hostname, port, transport }) => {
    console.log(`Listening on ${transport}://${hostname}:${port}`);
  },
}, handler);

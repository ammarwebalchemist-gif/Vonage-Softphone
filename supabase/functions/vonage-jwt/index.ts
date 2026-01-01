import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { encode as base64UrlEncode } from "https://deno.land/std@0.208.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VONAGE_APPLICATION_ID = "716cc0b9-8b3a-46ed-a170-955debc7e21a";

const VONAGE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDI7wxPDxTX1/Ps
l+wovpLkCYEaVZtT8te8iOLX4v+pakRn/S+4ZAYG0NgXj4CDCY2NnvGLAEO0Bvfu
99VXyx1Q2r7Pwd51sdQ2bsrIifJDBVNlBzw2DnKT33PhpMgUNRwBWBpwPmSlJHoV
dKu5lqw3o84sc/ySO1yRQd/4XIn/sZ0K4tTH1BuC+Ae6EuUogyRmk3HG3M6m2fqX
CPhkZfOcONFTN1FeH2VlrXm7dI2EwzQCjOeIkpjFiaoU/h9jo0I9R302YCOpv+qz
N+cmYgVVMjRm/KIuRsnbrl1VGW5xfVIlky3rS/ZOr/9HSR3DoqY90mT//+KXzvgy
RqWUfqkxAgMBAAECggEACQMr1qnzAeFmR/Dif0tY9FB20XMQhfno8kRjhFJirDsf
eViSWN9no8ufPaNKnNYDWtxLsjPfVYZQfY/xKkBqfrNpBpGIBFhnD8/1WXxSeO4W
uPvTmAsa2YYWwQKulLVzHZ5RhUJPKlcSAL9canUXIWHAAB9trzNpafx96rpf2C+P
WA0FCCCvcM+3XeAgnUGc4euLiHs15KlvjqwYPmbOpPeO/yh6CQkBbOmvIVaEsMv4
4wrUiNfwtG80yojXbEi6PRYAKbdc0nHvRmnQb9vsBIM/Ceno8HEBVk85ZVoeKVmC
fctBJh+xLZ2jEang+JjphTzYNNAl3cEtVsWuVz2n3wKBgQD0dm+6wwQeYdzmKSVC
hvQM9iWMNeQFHKwujj4j0FOJZdBntWlKcglahhCCA+KX4pHTNCJBRmSmu34nXfpZ
7OyzHpQJB5KZHV0BwJBlAmTe/5wlRPz87cNw3tIJcg8+FTb49ZtCPpgmtPWuJ6H2
5iLw7ZbzSz9qSpKQNfAU+NS3dwKBgQDSarO3B1Gz7kaHoI+1weSZ+9KTkbDctems
f5zl3bOoSJeH/ekYVs+XI3JKO4qkOIn50lEU+lUs1e33sujzkRaSyz+PNIxwOHQA
/3LgLqttRkdppgfujQaytMnj7S8+jxOh7KBxrDGV65uwVHozq2ORa19UeUhFRpHg
ZDv+IU2elwKBgBcyofmcBekIKlkg8Gs2uTP9q6R5fLDLfr9QOi9V1oeERNmCioJI
/gA8Fpbv3XHCS0o6eUGud2CnDBqaPWaJKBD7RtrwgAXNloTTDCC5sG7E3MFgoY0y
1sgALPg+fZnLk5LeY6ROokuSAnpLQoBWaFxqf1eI/XSNrQjIRYcH8c+TAoGAIBcr
328bU9C0Kv0ezb6LabyRKfZfPdn0kF1KBXihbLndel0MDq02rbs3NAEOrOr+h/4+
ZW+kS9k4mL1Nb9Ah3DNpNyLxhC/n6TsMPwp/FIRSYddzgDs72UdfPwauXOEfQmO/
OHblfRLYxLStinHKFqSEfnKcxgv0NX+z8pcLqnMCgYEAx9k8WUggN7RJ8ZYTBmXD
dywBO0L/9dQL23zXyCu4J7Gmevd28XpPS4ov2tinecQ3xq2wX8dHx4u7gB1MYiOa
OcJfsTCVZL7eFEXcvGCOt6GNS3q9lZB5E4NpTbOYg4mb9oEA95tc1m30bDMJGKpa
ba+TSvHEL8LOvvG6LnApjUo=
-----END PRIVATE KEY-----`;

interface JWTPayload {
  application_id: string;
  iat: number;
  jti: string;
  exp: number;
  acl: {
    paths: Record<string, Record<string, unknown>>;
  };
  sub?: string;
}

function generateUUID(): string {
  return crypto.randomUUID();
}

async function createVonageJWT(userId?: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 86400;

  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const payload: JWTPayload = {
    application_id: VONAGE_APPLICATION_ID,
    iat: now,
    jti: generateUUID(),
    exp: expiry,
    acl: {
      paths: {
        "/*/users/**": {},
        "/*/conversations/**": {},
        "/*/sessions/**": {},
        "/*/devices/**": {},
        "/*/image/**": {},
        "/*/media/**": {},
        "/*/applications/**": {},
        "/*/push/**": {},
        "/*/knocking/**": {},
        "/*/legs/**": {},
      },
    },
  };

  if (userId) {
    payload.sub = userId;
  }

  const encodedHeader = base64UrlEncode(new TextEncoder().encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const signatureInput = `${encodedHeader}.${encodedPayload}`;

  const pemContents = VONAGE_PRIVATE_KEY
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");

  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));

  const privateKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    {
      name: "RSASSA-PKCS1-v1_5",
      hash: "SHA-256",
    },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    privateKey,
    new TextEncoder().encode(signatureInput)
  );

  const encodedSignature = base64UrlEncode(new Uint8Array(signature));

  return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let userId: string | undefined;

    if (req.method === "POST") {
      try {
        const body = await req.json();
        userId = body.userId;
      } catch {
      }
    }

    const token = await createVonageJWT(userId);

    return new Response(
      JSON.stringify({
        token,
        expiresIn: 86400,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("JWT generation error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to generate JWT",
        details: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});

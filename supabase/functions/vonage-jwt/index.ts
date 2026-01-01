import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { encode as base64UrlEncode } from "https://deno.land/std@0.208.0/encoding/base64url.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const VONAGE_APPLICATION_ID = "716cc0b9-8b3a-46ed-a170-955debc7e21a";

const VONAGE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6nrVW0zGrUjQr
Nmq7lRgp1j5kRu36+uIMqIOQeH/4zOZ5dAJNmsEHac3bKtgTq6Z/w0rG1+62/4jv
o3tjQLPLb2Z+vTqZ1j6WzckiICvA1MyP1nQGyPWme/wSC7KCu5ktrQcGLFccbII0
h+70FqQN1lyIl+FBPqlG8EWeD7LocAdPJvaPiBYs8aAu4bUDCuCtfrBaDfgtAD25
pqHeXlefZhQzFPp6jDDA6nlw8MQc+ibPMFA5HTQQ2NfR5fOwYN9mwn8mdgV48oIX
cHlK+99ry5k6QWfrGPlUazuAX1gJqqj4/FTCsXOZA9mqhYmJLS6mcyOWJ47aD5N6
p2hET54TAgMBAAECggEABuFYQPw5hfenS4fB3zdiLa19ai46eRjyaCvdgq0Lb5cD
Hd7K2vH/d3azvtNq8sa1G8H0EGkTnvsq1EYltwVCqH4FIsHdPQceEmp1DBhwvh1z
8UJwNdo6deN3HQwBwW1WYQDsRywvuTEmJJB1nQz2PW0pLWWg42PpBiy2x44MNyK7
s4+BkW/Uv3b4M2CrkP/1HGwLwmDB9kDed0Dn40tV43HCkE6GRV8P/fRP6fbMLp2f
gBsuRLAT3GG/uaD0gUdphAXk7kSc5Q1uFVE8RmuMP7c50FZGj8tAiLBmTiIRRvZZ
9UAYBpWMy6/rc8YQ0+7gNbp+7cVaBiBsH44YAPBneQKBgQDe0I22S6K+qcT5hGN0
6xtMsAv5RWpAVJci2i6oXwODbp1aiDhxK5hXEuPWsqBT8MOjSrLLNLVR1jE0Qdho
reBdT7trRP8wYXYDAGcibdTenyVFK8G1hYbO+fBrvJuEhEI+T80NkrQKTDPMWW4Z
+YKDTbuuARZ7oAFVeO1IbveBNwKBgQDWaiDFQvatWBpxD2TT87VgtjCPnytXqVKL
vZwL9EfH1rhdkTupdxKkyXo+JR4jW0E+su5MDOipn6AlvLE+vgYSOP6grE2/k6CG
2ek8n9itLP58yc/DuRoGKqkHOhLCT7rVi2glEBRyg45jw2aU1cY+cvs9skeTvNZW
QDcmx8KoBQKBgQCoeoQdSpXVm6NglLVri/cJhriXFODhodTiOp47HBUZBcQf147u
K+u2M4dqKYlHz27vAyWst78/EToFbKCJjqhvhkGOPA7F83v7iwtxIiFq8GWLJyoC
6uNjj+Q2YtgpXKSGX2sKj1ppyvMD2r+BDoScamO2kAYDFprLmXO6aIXoAwKBgQCw
3njL4BI2KeAd9XHZ+UZcUc27G7SYKl+iUDWiEs8HhRMuc/hAMa4aauzAyMOUrNkk
TFuQNnHSQo/LsVyQghXmAEfi6F92MeQQeT8RuFX3fI8tBxiwvkc+YQBvqrMAwN5A
+y9cq2gCkozptK0xByryJs0jNqYes34nRe94uP3UtQKBgHHCTgmnX1zZKHOmwz6X
WP5b0QMqWsVW8sHLnUlh3iVFvFy8pi4BYLWzXDwLhAwdmAtM/BNWyfHd6qK2zlow
TyyEC1oVeoPZkwE7irh6+st+IceKEWhW81T8LKxpdbcJNsJnueGPrEchkC4DpZtx
FUiHAWIM7rOj3hv+j5vQX20k
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
        // Body parsing failed, continue without userId
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

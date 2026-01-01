import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const FROM_NUMBER = "447418343743";
const EVENT_URL = Deno.env.get("SUPABASE_URL") + "/functions/v1/vonage-event";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const to = url.searchParams.get("to");
    const from = url.searchParams.get("from");
    const conversationUuid = url.searchParams.get("conversation_uuid");
    const uuid = url.searchParams.get("uuid");

    console.log("Answer webhook received:", {
      to,
      from,
      conversationUuid,
      uuid,
    });

    const ncco = [
      {
        action: "record",
        eventUrl: [EVENT_URL],
        beepStart: true,
        endOnSilence: 5,
        timeOut: 7200,
      },
      {
        action: "connect",
        from: FROM_NUMBER,
        eventUrl: [EVENT_URL],
        endpoint: [
          {
            type: "phone",
            number: to || "",
          },
        ],
      },
    ];

    return new Response(JSON.stringify(ncco), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Answer webhook error:", error);

    const errorNcco = [
      {
        action: "talk",
        text: "Sorry, there was an error connecting your call. Please try again.",
      },
    ];

    return new Response(JSON.stringify(errorNcco), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  }
});

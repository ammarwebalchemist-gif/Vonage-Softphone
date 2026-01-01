import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface VonageEvent {
  status?: string;
  uuid?: string;
  conversation_uuid?: string;
  direction?: string;
  timestamp?: string;
  start_time?: string;
  end_time?: string;
  duration?: string;
  recording_url?: string;
  recording_uuid?: string;
  price?: string;
  rate?: string;
  from?: string;
  to?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    let event: VonageEvent = {};

    if (req.method === "POST") {
      event = await req.json();
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      event = Object.fromEntries(url.searchParams);
    }

    console.log("Vonage Event received:", JSON.stringify(event, null, 2));

    const { status, uuid, recording_url, recording_uuid, duration, price } = event;

    if (status) {
      console.log(`Call ${uuid} status changed to: ${status}`);
    }

    if (recording_url) {
      console.log(`Recording available for call ${uuid}:`, {
        recordingUrl: recording_url,
        recordingUuid: recording_uuid,
        duration,
      });
    }

    if (status === "completed") {
      console.log(`Call ${uuid} completed:`, {
        duration,
        price,
      });
    }

    return new Response(
      JSON.stringify({ received: true }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Event webhook error:", error);

    return new Response(
      JSON.stringify({
        error: "Failed to process event",
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

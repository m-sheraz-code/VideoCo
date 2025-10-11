import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ message: "Only POST allowed" }),
        { status: 405, headers: { "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    console.log("✅ Monday Webhook Received:", payload);

    return new Response(
      JSON.stringify({ message: "Webhook received" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in webhook handler:", error);
    return new Response(
      JSON.stringify({ error: "Invalid JSON or internal error" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface PartnerFormData {
  name: string;
  email: string;
  company?: string;
  partnershipType: string;
  message: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: PartnerFormData = await req.json();
    console.log("Received partner form submission:", data);

    // Get partnership type in German
    const partnershipTypes: Record<string, string> = {
      premium: "Premium Event Posting",
      sponsorship: "Event Sponsoring",
      advertising: "Lokale Werbung",
      workshop: "Workshop / Talk",
      other: "Andere Kooperation",
    };

    const partnershipTypeText = partnershipTypes[data.partnershipType] || data.partnershipType;

    // Send email to the administrator
    const emailResponse = await resend.emails.send({
      from: "THE TRIBE.BI <onboarding@resend.dev>",
      to: ["maik.z@gmx.de"],
      subject: `Neue Partneranfrage von ${data.name}`,
      html: `
        <h1>Neue Partneranfrage von THE TRIBE.BI Website</h1>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>E-Mail:</strong> ${data.email}</p>
        <p><strong>Unternehmen:</strong> ${data.company || "-"}</p>
        <p><strong>Art der Kooperation:</strong> ${partnershipTypeText}</p>
        <p><strong>Nachricht:</strong></p>
        <p style="white-space: pre-line;">${data.message}</p>
        <hr />
        <p>Diese Nachricht wurde über das Kontaktformular auf der THE TRIBE.BI Website gesendet.</p>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-partner-email function:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);

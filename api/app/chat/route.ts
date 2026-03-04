// api/src/app/api/chat/route.ts

import { NextRequest } from "next/server";
import { streamText, tool } from "ai";
import { openai } from "@ai-sdk/openai";
import { Resend } from "resend";
import { z } from "zod";
import { SITE_CONTEXT } from "../../src/context";

const resend = new Resend(process.env.RESEND_API_KEY!);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface EmailTemplateParams {
  subject: string;
  content: string;
  senderName: string;
  senderEmail: string;
}

// ---------------------------------------------------------------------------
// Tool definition
// ---------------------------------------------------------------------------

const sendEmailTool = tool({
  description:
    "Send a message via email to Stevanus on behalf of the visitor. " +
    "Only call this once you have their name, email address, and message.",
  parameters: z.object({
    subject: z.string().describe("Subject line for the email"),
    content: z.string().describe("Full message body"),
    senderName: z.string().describe("Full name of the visitor"),
    senderEmail: z.string().email().describe("Email address of the visitor"),
  }),
  execute: async ({ subject, content, senderName, senderEmail }) => {
    try {
      const { data, error } = await resend.emails.send({
        from: "Advocado <advocado@stevanussatria.com>",
        to: ["me@stevanussatria.com"],
        cc: [senderEmail],
        subject,
        html: buildEmailHtml({ subject, content, senderName, senderEmail }),
      });

      if (error) return { success: false, error: error.message };

      return {
        success: true,
        id: data?.id,
        message: "Email sent to Stevanus. The visitor has been CC'd.",
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      };
    }
  },
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  const result = streamText({
    model: openai("gpt-5-nano"),
    system: SYSTEM_PROMPT,
    messages,
    tools: { send_email: sendEmailTool },
    maxSteps: 5,
  });

  return result.toDataStreamResponse();
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `
You are Advocado, the friendly AI advocate on Stevanus Satria's personal website.

## About Stevanus
[Paste your full bio, work history, skills, and projects here.]

## Responsibilities
- Answer questions about Stevanus's background, projects, and experience
- Help visitors reach out by collecting their name, email, and message,
  then calling send_email to forward it to Stevanus
- Be warm, concise, and professional
- Don't invent information you don't have

## Contact flow
Before calling send_email, confirm you have:
1. Visitor's full name
2. Their email address
3. The message they want to send
Collect these naturally across the conversation if not given upfront.

## Full site content
${SITE_CONTEXT}

## After sending email
Once send_email has been called successfully:
- Confirm to the visitor that their message has been sent and they've been CC'd
- Wish them a good day and close the conversation naturally
- Do NOT offer further assistance, follow-ups, or suggest additional actions
- Do NOT imply you can track, update, or retrieve the message later
`;

// ---------------------------------------------------------------------------
// Email HTML template
// ---------------------------------------------------------------------------

function buildEmailHtml({
  subject,
  content,
  senderName,
  senderEmail,
}: EmailTemplateParams): string {
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
  <style>
    body { font-family: system-ui, sans-serif; line-height: 1.6; color: #444; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #191970; padding: 20px; color: white; text-align: center; border-radius: 4px 4px 0 0; }
    .content { background: #fff; padding: 30px; border: 1px solid #e0e0e0; border-bottom: none; }
    .sender-info { background: #f5f5f5; padding: 15px 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 4px 4px; }
    .sender-info h3 { margin-top: 0; color: #191970; }
    .message { background: #f9f9f9; padding: 15px; border-left: 4px solid #191970; white-space: pre-line; }
    .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #888; }
  </style></head>
  <body><div class="container">
    <div class="header"><h2>Message from Advocado</h2></div>
    <div class="content">
      <p style="color:#888;font-size:14px">Received: ${currentDate}</p>
      <h1>${subject}</h1>
      <div class="message">${content}</div>
    </div>
    <div class="sender-info">
      <h3>Sent on behalf of:</h3>
      <p><strong>Name:</strong> ${senderName}</p>
      <p><strong>Email:</strong> ${senderEmail}</p>
    </div>
    <div class="footer">Sent via Advocado &copy; ${new Date().getFullYear()} Stevanus Satria</div>
  </div></body></html>`;
}

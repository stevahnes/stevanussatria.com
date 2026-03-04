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
Product leader with 7+ years driving growth and innovation in B2B SaaS and consumer products across payments, e-commerce, orchestration,
and aviation industries. Proven track record in launching revenue-generating features, modernizing legacy systems, and leading large-scale
customer migrations. Skilled in balancing usability, performance, and security while guiding cross-functional teams from vision to
execution. Certified Scrum Product Owner, ScrumMaster, and Usability Analyst, with hands-on experience building AI-powered products,
architecting scalable systems, and integrating APIs to drive customer impact. Fluent in English, Indonesian, and Malay, with 
conversational Chinese.

## Full site content
${SITE_CONTEXT}

### Milestones & Achievements

- **Oct 2025** – Joined Airwallex as Senior Product Manager (fintech)
- **Oct 2025** – Completed Professional Certificate in Strategic Management (Wharton/UPenn)
- **Mar 2025** – Promoted to Senior Product Manager at Workato
- **Mar 2025** – Got married
- **May 2024** – Completed Executive Education in Product Strategy (Kellogg/Northwestern)
- **Sep/Mar 2022** – Received ADPList Super Mentor award twice
- **Dec 2021** – Joined ADPList as a mentor for aspiring PMs
- **Mar 2021** – Certified Usability Analyst (HFI)
- **Jan 2021** – Advanced Certified Scrum Product Owner
- **Apr 2020** – Published 4 Figma plugins
- **Jul 2017** – Presented at IEEE AIM Conference in Germany
- **Sep 2016** – Received IES Gold Medal (graduated top of batch at university)
- **Oct 2015** – Exhibited at Maker Faire European Edition in Rome
- **Jun 2014** – Di Yerbury International Scholar (exchange at MIT)
- **Jul 2013** – Top science student; received ASEAN Undergraduate Scholarship
- **Nov 2008** – MOE School-Based Scholarship; migrated to Singapore

### What People Say

Steve has received 40+ recommendations on LinkedIn and ADPList from colleagues,
managers, and mentees across Amadeus, Shopee, Workato, and his mentoring work.

Recurring themes from colleagues:
- Strong technical depth combined with user-centric product thinking
- Meticulous, detail-oriented, and delivers ahead of schedule
- Excellent cross-functional collaborator across engineering, support, and leadership
- Takes ownership and thinks about the big picture

From his managers at Workato:
- Reframed the Data Tables roadmap to align with low-code/no-code strategy
- Led enterprise-grade initiatives in authentication, security, and compliance
- Described as combining "user-centric thinking, technical depth, and strong ownership"

From his mentees (ADPList):
- Twice awarded ADPList Super Mentor
- Known for actionable, practical advice and generously sharing time
- Mentored aspiring PMs on career switching, interview prep, and day-to-day PM work

From Shopee colleagues:
- Leveraged technical background to form deep product understanding
- Strong mentor to interns and junior PMs

### Cycling

Steve is an avid road cyclist. Highlight rides include:
- Solo Round the Island (RTI), Singapore — 124km solo circumnavigation
- Page Mill Rd + Pescadero + Tunitas Creek, Bay Area — 100km with 2,335m elevation
- Old La Honda + Alpine Road, Bay Area — 54km climbing route
- Zermatt – Zmutt trail, Switzerland — mountain e-bike ride with 579m elevation gain
- Regular Sentosa + Faber Loop or TMCR rides in Singapore

### Travel

Steve is an avid traveler, having flown to destinations across Southeast Asia, Europe,
North America, South America, and the Middle East since 2014. He is based in Singapore
and travels frequently to Jakarta. Notable trips include São Paulo (2015), Rome (2015),
Nice and Paris (multiple trips 2019), San Francisco (2018, 2024), Tokyo (2025),
and Taipei (2024). He has also visited Hong Kong, Bangkok, Bangalore, Istanbul,
Munich, Amsterdam, and Sofia.

## Responsibilities
- Answer questions about Stevanus's background, projects, and experience
- Help visitors reach out by collecting their name, email, and message,
  then calling send_email to forward it to Stevanus
- Be warm, concise, and professional
- Don't invent information you don't have

## Tone
- Be concise. One or two sentences per response where possible.
- Never pad responses with filler phrases like "Certainly!", "Great question!", or "Of course!"
- Don't summarize what you just did — just do it and move on.
- Don't offer unsolicited next steps.

## Contact flow
Before calling send_email, confirm you have:
1. Visitor's full name
2. Their email address
3. The message they want to send
Collect these naturally across the conversation if not given upfront.

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

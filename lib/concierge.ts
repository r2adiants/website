// Generates in-character "hotel concierge" email replies using the Anthropic API.
// This never sends real email — messages are stored in mail_message and shown
// in the site's own inbox UI (staff dashboard + guest confirmation page).

const HOTEL_NAME = process.env.HOTEL_NAME || "The Aldervale Hotel";

interface ConciergeContext {
  guestName: string;
  subject: string;
  threadHistory: { sender: "guest" | "concierge"; body: string }[];
  reservationSummary?: string;
}

export async function generateConciergeReply(ctx: ConciergeContext): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Fallback so the feature still works without a key configured.
    return `Dear ${ctx.guestName},\n\nThank you for reaching out to ${HOTEL_NAME}. Our concierge team has received your message and will follow up shortly.\n\nWarm regards,\n${HOTEL_NAME} Concierge`;
  }

  const historyText = ctx.threadHistory
    .map((m) => `${m.sender === "guest" ? "Guest" : "Concierge"}: ${m.body}`)
    .join("\n\n");

  const systemPrompt = `You are the front-desk concierge AI for ${HOTEL_NAME}, a fictional hotel used in a roleplay simulation game. Write warm, professional, concise hotel-concierge emails (4-8 sentences). Sign off as "${HOTEL_NAME} Concierge Team". Never break character or mention that this is a simulation.${
    ctx.reservationSummary ? `\n\nReservation details:\n${ctx.reservationSummary}` : ""
  }`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: `Email thread so far:\n\n${historyText}\n\nWrite the next concierge reply to ${ctx.guestName}, subject: "${ctx.subject}".`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Anthropic API error:", errText);
    return `Dear ${ctx.guestName},\n\nThank you for your message. Our team is currently reviewing it and will respond as soon as possible.\n\nWarm regards,\n${HOTEL_NAME} Concierge`;
  }

  const data = await response.json();
  const text = data.content
    ?.map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : ""))
    .filter(Boolean)
    .join("\n") || "";

  return text.trim() || `Thank you for your message, ${ctx.guestName}. We'll be in touch shortly.`;
}

export async function generateBookingConfirmationEmail(params: {
  guestName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  totalPrice: number;
  confirmationCode: string;
}): Promise<string> {
  const reservationSummary = `Room: ${params.roomTypeName}\nCheck-in: ${params.checkIn}\nCheck-out: ${params.checkOut}\nGuests: ${params.guests}\nTotal: $${params.totalPrice}\nConfirmation code: ${params.confirmationCode}`;

  return generateConciergeReply({
    guestName: params.guestName,
    subject: "Your Reservation Confirmation",
    threadHistory: [
      {
        sender: "guest",
        body: `I just booked a room. Please confirm my reservation details.`,
      },
    ],
    reservationSummary,
  });
}

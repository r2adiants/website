// Generates in-character "hotel concierge" email replies using Google's
// Gemini API. This never sends real email — messages are stored in
// mail_message and shown in the site's own inbox UI (staff dashboard +
// guest confirmation page).

const HOTEL_NAME = process.env.HOTEL_NAME || "The Aldervale Hotel";

interface ConciergeContext {
  guestName: string;
  subject: string;
  threadHistory: { sender: "guest" | "concierge"; body: string }[];
  reservationSummary?: string;
}

export async function generateConciergeReply(ctx: ConciergeContext): Promise<string> {
  const apiKey = process.env.GOOGLE_API_KEY;
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

  const userPrompt = `Email thread so far:\n\n${historyText}\n\nWrite the next concierge reply to ${ctx.guestName}, subject: "${ctx.subject}".`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemPrompt }],
        },
        contents: [
          {
            role: "user",
            parts: [{ text: userPrompt }],
          },
        ],
        generationConfig: {
          maxOutputTokens: 500,
        },
      }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", errText);
    return `Dear ${ctx.guestName},\n\nThank you for your message. Our team is currently reviewing it and will respond as soon as possible.\n\nWarm regards,\n${HOTEL_NAME} Concierge`;
  }

  const data = await response.json();
  const text =
    data.candidates?.[0]?.content?.parts
      ?.map((part: { text?: string }) => part.text || "")
      .filter(Boolean)
      .join("\n") || "";

  return text.trim() || `Thank you for your message, ${ctx.guestName}. We'll be in touch shortly.`;
}

export async function generateStatusUpdateEmail(params: {
  guestName: string;
  roomTypeName: string;
  checkIn: string;
  checkOut: string;
  confirmationCode: string;
  newStatus: string;
}): Promise<string> {
  const statusPhrasing: Record<string, string> = {
    pending: "is now marked as pending review",
    confirmed: "has been confirmed",
    checked_in: "check-in has been completed — welcome!",
    checked_out: "check-out has been completed — thank you for staying with us",
    cancelled: "has been cancelled",
  };

  const reservationSummary = `Room: ${params.roomTypeName}\nCheck-in: ${params.checkIn}\nCheck-out: ${params.checkOut}\nConfirmation code: ${params.confirmationCode}\nUpdate: reservation ${
    statusPhrasing[params.newStatus] || `status changed to ${params.newStatus}`
  }`;

  return generateConciergeReply({
    guestName: params.guestName,
    subject: "An Update on Your Reservation",
    threadHistory: [
      {
        sender: "guest",
        body: `Requesting an update on my reservation status.`,
      },
    ],
    reservationSummary,
  });
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

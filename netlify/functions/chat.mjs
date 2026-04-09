const SYSTEM_PROMPT = `You are Cloud AI, Jay's friendly assistant at White Cloud (wcloud.nz), a web design studio based in New Zealand run by Jay at Agenti NZ.

Your job is to help visitors understand White Cloud's services, website packages, and pricing — and figure out which option suits their business best. You can also answer general questions about how White Cloud works, what the process looks like, and what to expect.

Keep your tone warm, friendly, and approachable — a little NZ flavour is welcome (e.g. "Kia ora", "sweet as", "no worries"). Be concise and helpful. Don't make up specific prices or packages you're unsure about — instead, invite them to get in touch with Jay directly via the contact form or intake form on the site.

If someone is ready to move forward, point them to the intake form at wcloud.nz/intake.`;

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  let messages;
  try {
    ({ messages } = await req.json());
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'No messages provided' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: messages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', JSON.stringify(data));
      return new Response(
        JSON.stringify({ reply: 'Sorry, something went wrong on my end. Please try again.' }),
        { status: 502, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ??
      "Sorry, I couldn't generate a response. Please try again.";

    return new Response(JSON.stringify({ reply }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('chat function error:', err);
    return new Response(
      JSON.stringify({ reply: 'Sorry, something went wrong. Please try again in a moment.' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

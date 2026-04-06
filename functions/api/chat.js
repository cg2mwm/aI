export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    let messages = body.messages || [];
    const hasImage = body.hasImage || false;

    const model = hasImage
      ? "@cf/meta/llama-3.2-11b-vision-instruct"
      : "@cf/meta/llama-3.3-70b-instruct-fp8-fast";

    // Trim: keep only last 10 messages to stay within context window
    if (messages.length > 10) {
      messages = messages.slice(-10);
    }

    // Truncate any individual message content that's too long
    messages = messages.map(m => {
      if (typeof m.content === 'string' && m.content.length > 6000) {
        return { ...m, content: m.content.slice(0, 6000) + '\n\n[Content truncated for length]' };
      }
      // Handle array content (vision messages)
      if (Array.isArray(m.content)) {
        return {
          ...m,
          content: m.content.map(part => {
            if (part.type === 'text' && part.text && part.text.length > 6000) {
              return { ...part, text: part.text.slice(0, 6000) + '\n\n[Content truncated for length]' };
            }
            return part;
          })
        };
      }
      return m;
    });

    const fullMessages = [
      { role: "system", content: "You are Nexus AI, a helpful, friendly, and concise assistant. Give clear and useful answers." },
      ...messages
    ];

    const resp = await context.env.AI.run(model, {
      messages: fullMessages,
      max_tokens: 1024,
    });

    return new Response(JSON.stringify({ response: resp.response }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

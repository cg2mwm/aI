export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    const messages = body.messages || [];

    const fullMessages = [
      { role: "system", content: "You are Nexus AI, a helpful, friendly, and concise assistant. Give clear and useful answers." },
      ...messages
    ];

    const resp = await context.env.AI.run("@cf/meta/llama-3.3-70b-instruct-fp8-fast", {
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

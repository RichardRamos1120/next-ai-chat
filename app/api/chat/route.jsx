import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req) {
  const sanitizeInput = async (input) => {
    return input.replace(/<[^>]*>?/gm, '');
  };

  try {
    const { message } = await req.json();
    const sanitizedMessage = await sanitizeInput(message);

    const chatCompletion = await client.chat.completions.create({
      messages: [{ role: 'user', content: sanitizedMessage }],
      model: 'gpt-3.5-turbo',
      stream: true
    });

    const encoder = new TextEncoder();

    const readableStream = new ReadableStream({
      async start(controller) {
        for await (const chunk of chatCompletion) {
          const text = chunk.choices[0].delta.content || '';
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      }
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain',
      }
    });

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to parse request body',
    }, { status: 400 });
  }
}

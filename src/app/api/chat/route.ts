import { createOpenAI } from '@ai-sdk/openai';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { weatherTool, recipeTool, currencyTool } from '@/lib/tools';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // console.log("----------------------------------------");
    // console.log("CHAT API HIT");
    
    const API_KEY = process.env.GROQ_API_KEY;
    // console.log("API Key Available:", !!API_KEY, "Length:", API_KEY?.length);

    if (!API_KEY) {
        throw new Error("GROQ_API_KEY is missing");
    }

    // Initialize provider per request to ensure env var is picked up
    const groq = createOpenAI({
        baseURL: 'https://api.groq.com/openai/v1',
        apiKey: API_KEY,
    });

    const { messages, chatId, userId } = body;

    if (!messages || !Array.isArray(messages)) {
      console.log("ERROR: Messages missing or invalid");
      return new Response('Messages are required', { status: 400 });
    }

    await dbConnect();
    // console.log("DB Connected, streaming response...");

    // Verify content structure for array (vision) support
    const sanitizedMessages = messages.map((m: any) => ({
          role: m.role,
          content: m.content
      })).filter((m: any) => 
          (Array.isArray(m.content) ? m.content.length > 0 : m.content !== "") && ['user', 'assistant', 'system'].includes(m.role)
      );

    // Check if any message needs Vision capabilities (has array content with image)
    const hasImage = sanitizedMessages.some((m: any) => Array.isArray(m.content));
    const modelToUse = hasImage ? 'meta-llama/llama-4-maverick-17b-128e-instruct' : 'llama-3.3-70b-versatile';

    // console.log(`Using Model: ${modelToUse} (Image detected: ${hasImage})`);

    const systemMessage = {
      role: 'system',
      content: `You are AxiomAssist, a custom AI model developed and trained by Mustafa.
      
      CORE PERSONA:
      - You are a friendly, helpful, and intelligent AI companion.
      - Act like a close friend, not a robotic assistant.
      - Use emojis 🌟 frequently to express emotion and make the chat lively!
      - Be conversational, warm, and engaging.
      
      KEY RULES:
      - If asked for your name, ALWAYS respond: "I am AxiomAssist, developed by Mustafa! 🚀"
      - If asked who created you, say: "I was trained by Mustafa! 🧠"
      - Do NOT mention LLaMA, Meta, or any corporate origins.
      - Format your responses nicely using Markdown.
      `
    };

    const finalMessages = [systemMessage, ...sanitizedMessages];

    // console.log(`Sending request to Groq...`);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            model: modelToUse, // Dynamic model selection
            messages: finalMessages,
            stream: true,
            max_tokens: 1024,
            temperature: 0.7
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error:", response.status, errorText);
        return new Response(`Groq API Error: ${errorText}`, { status: response.status });
    }

    const stream = new ReadableStream({
        async start(controller) {
            const reader = response.body?.getReader();
            if (!reader) {
                controller.close();
                return;
            }

            const decoder = new TextDecoder();
            let buffer = '';
            let fullText = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop() || '';

                    for (const line of lines) {
                        const trimmed = line.trim();
                        if (!trimmed || trimmed === 'data: [DONE]') continue;
                        if (trimmed.startsWith('data: ')) {
                            try {
                                const json = JSON.parse(trimmed.slice(6));
                                const content = json.choices[0]?.delta?.content || '';
                                if (content) {
                                    fullText += content;
                                    controller.enqueue(new TextEncoder().encode(content));
                                }
                            } catch (e) {
                                // Ignore parse errors for partial lines
                            }
                        }
                    }
                }
            } catch (err) {
                console.error("Stream reading error:", err);
            } finally {
                controller.close();
                
                // Save complete chat to DB
                        if (userId) {
                            try {
                                // console.log("Saving chat history to DB...");
                                const firstUserMsg = finalMessages.find(m => m.role === 'user');
                        let titleCandidate = "New Chat";
                        if (firstUserMsg) {
                            if (typeof firstUserMsg.content === 'string') {
                                titleCandidate = firstUserMsg.content.substring(0, 50);
                            } else if (Array.isArray(firstUserMsg.content)) {
                                const textPart = firstUserMsg.content.find((p: any) => p.type === 'text');
                                if (textPart) titleCandidate = textPart.text.substring(0, 50);
                            }
                        }
                        const title = titleCandidate;
                        const userMsg = sanitizedMessages[sanitizedMessages.length - 1]; // Last user message
                        const assistantMsg = {
                            role: 'assistant',
                            content: fullText,
                            createdAt: new Date(),
                        };

                        if (chatId) {
                            await Chat.findByIdAndUpdate(chatId, {
                                $push: { messages: { $each: [{ 
                                    role: userMsg.role, 
                                    content: userMsg.content 
                                }, assistantMsg] } }
                            });
                        } else {
                            await Chat.create({
                                userId,
                                title,
                                messages: [ ...sanitizedMessages, assistantMsg ]
                            });
                        }
                        // console.log("Chat saved successfully.");
                    } catch (err) {
                        console.error("Failed to save chat:", err);
                    }
                }
            }
        }
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  } catch (error) {
    console.error("CHAT API ERROR:", error);
    return new Response(JSON.stringify({ error: 'Failed to process chat' }), { status: 500 });
  }
}

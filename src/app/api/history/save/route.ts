import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';

export async function POST(req: Request) {
  try {
    const { userId, messages, chatId } = await req.json();

    if (!userId || !messages) {
      return NextResponse.json({ error: 'Missing requirements' }, { status: 400 });
    }

    await dbConnect();

    let title = 'New Chat';
    if (messages.length > 0) {
      const firstUserMsg = messages.find((m: any) => m.role === 'user');
      if (firstUserMsg) {
        title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
      }
    }

    let chat;
    if (chatId) {
      chat = await Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { messages, updatedAt: new Date() },
        { new: true }
      );
    } else {
      chat = await Chat.create({
        userId,
        title,
        messages,
      });
    }

    return NextResponse.json({ success: true, chat });
  } catch (error) {
    console.error('Save error:', error);
    return NextResponse.json({ error: 'Failed to save chat' }, { status: 500 });
  }
}

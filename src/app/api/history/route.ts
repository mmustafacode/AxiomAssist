import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  if (!userId) {
    return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
  }

  await dbConnect();

  try {
    const chats = await Chat.find({ userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt updatedAt') 
      .limit(50);
      
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const userId = searchParams.get('userId');
  const deleteAll = searchParams.get('deleteAll');

  await dbConnect();

  try {
    if (deleteAll === 'true' && userId) {
      await Chat.deleteMany({ userId });
      return NextResponse.json({ success: true, message: 'All chats deleted' });
    }

    if (id) {
      await Chat.findByIdAndDelete(id);
      return NextResponse.json({ success: true, message: 'Chat deleted' });
    }

    return NextResponse.json({ error: 'Missing id or userId' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete chat' }, { status: 500 });
  }
}

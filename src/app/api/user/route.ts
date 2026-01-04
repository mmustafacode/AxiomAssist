import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import Chat from '@/lib/models/Chat';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });

    await dbConnect();
    
    // @ts-ignore
    const userId = session.user.id;
    
    try {
        const user = await User.findByIdAndUpdate(userId, { name }, { new: true });
        return NextResponse.json({ success: true, user });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    // @ts-ignore
    const userId = session.user.id;

    try {
        // Delete all chats first
        await Chat.deleteMany({ userId });
        // Delete user
        await User.findByIdAndDelete(userId);
        
        return NextResponse.json({ success: true, message: 'Account deleted' });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}

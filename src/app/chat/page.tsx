import { ChatLayout } from '@/components/ChatLayout';
import dbConnect from '@/lib/db';
import Chat from '@/lib/models/Chat';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export default async function ChatPage(props: { searchParams: Promise<{ id?: string }> }) {
    const searchParams = await props.searchParams;
    const session = await getServerSession(authOptions);

    if (!session) {
        redirect('/auth/signin');
    }

    let initialMessages: any[] = [];
    const chatId = searchParams.id;

    if (chatId) {
        await dbConnect();
        const chat = await Chat.findOne({ _id: chatId, userId: (session.user as any).id });
        if (chat) {
            initialMessages = chat.messages.map((msg: any) => ({
                id: msg._id || msg.id, // Ensure id is present
                role: msg.role,
                content: msg.content,
            }));
        }
    }

    return (
        <ChatLayout initialMessages={initialMessages} chatId={chatId} />
    );
}

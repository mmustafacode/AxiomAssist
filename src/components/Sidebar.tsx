'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { MessageSquare, Plus, LogOut, X, History, Trash2, Settings, MoreHorizontal, Menu } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { SettingsModal } from './SettingsModal';
import { ConfirmationModal } from './ConfirmationModal';
import { useRouter } from 'next/navigation';

interface Chat {
    _id: string;
    title: string;
    createdAt: string;
}

interface SidebarProps {
    isOpen: boolean;
    isMobile: boolean;
    onClose: () => void;
    refreshKey: number;
    onNewChat?: () => void;
}

export function Sidebar({ isOpen, isMobile, onClose, refreshKey, onNewChat }: SidebarProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const [chats, setChats] = useState<Chat[]>([]);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    
    // Confirmation State
    const [chatToDelete, setChatToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        if (session?.user?.email) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            fetch(`/api/history?userId=${(session.user as any).id}`)
                .then((res) => res.json())
                .then((data) => {
                    if (Array.isArray(data)) setChats(data);
                })
                .catch(err => console.error("Failed to load history", err));
        }
    }, [session, refreshKey]); // Reload on refreshKey change

    const handleDeleteChat = async (e: React.MouseEvent, chatId: string) => {
        e.preventDefault();
        e.stopPropagation();
        setChatToDelete(chatId);
    };

    const confirmDeleteChat = async () => {
        if (!chatToDelete) return;
        setIsDeleting(true);
        try {
            await fetch(`/api/history?id=${chatToDelete}`, { method: 'DELETE' });
            setChats(chats.filter(c => c._id !== chatToDelete));
            if (window.location.search.includes(chatToDelete)) {
                router.push('/chat');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsDeleting(false);
            setChatToDelete(null);
        }
    };

    if (!session) return null;

    // Determine classes based on state
    const sidebarClasses = cn(
        "flex flex-col h-[100dvh] bg-secondary/40 backdrop-blur-xl transition-all duration-300 ease-in-out z-50",
        isMobile ? "fixed left-0 top-0 w-[280px] shadow-2xl bg-background/95" : "relative sticky top-0",
        // Desktop toggling: width 0/hidden vs width 280
        !isMobile && !isOpen ? "w-0 opacity-0 overflow-hidden" : "w-[280px] opacity-100"
    );

    // If mobile and closed, don't render or hide it off-screen
    const style = isMobile ? {
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
    } : {};

    return (
        <>
            <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
            
            <ConfirmationModal 
                isOpen={!!chatToDelete}
                onClose={() => setChatToDelete(null)}
                onConfirm={confirmDeleteChat}
                title="Delete Chat"
                description="Are you sure you want to delete this conversation? This action cannot be undone."
                confirmText="Delete"
                isDangerous
                isLoading={isDeleting}
            />
            
            <aside className={sidebarClasses} style={style}>
                {/* Sidebar Header (Mobile & Desktop) */}
                <div className="flex items-center gap-2 p-4 pb-2">
                    <button onClick={onClose} className="p-2 hover:bg-background/50 rounded-full transition-colors text-muted-foreground hover:text-foreground">
                        <Menu size={20} />
                    </button>
                    <div className="flex items-center gap-1.5 cursor-default select-none">
                        <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">AxiomAssist</span>
                        <div className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium border border-blue-500/20">Beta</div>
                    </div>
                </div>

                <div className="p-4 pb-2">
                    <button
                        onClick={() => {
                            if (onNewChat) onNewChat();
                            else router.push('/chat');
                            if (isMobile) onClose();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-all active:scale-[0.98] border border-blue-100/50 shadow-sm group justify-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <Plus size={18} strokeWidth={2.5} />
                        <span className="font-semibold text-sm">New Chat</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 scrollbar-hide py-2">
                    <div className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                        <History size={12} />
                        Recent
                    </div>
                    <div className="space-y-1">
                        {chats.map((chat) => (
                            <Link
                                key={chat._id}
                                href={`/chat?id=${chat._id}`}
                                onClick={isMobile ? onClose : undefined}
                                onMouseEnter={() => setHoveredChatId(chat._id)}
                                onMouseLeave={() => setHoveredChatId(null)}
                                className="flex items-center gap-3 px-4 py-3 text-sm text-foreground/80 hover:bg-background/80 hover:text-foreground rounded-lg transition-all group relative overflow-hidden"
                            >
                                <MessageSquare size={16} className="shrink-0 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="truncate flex-1">{chat.title}</span>
                                
                                {/* Delete Button - Visible on Hover */}
                                {hoveredChatId === chat._id && (
                                    <button 
                                        onClick={(e) => handleDeleteChat(e, chat._id)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-all opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </Link>
                        ))}
                        {chats.length === 0 && (
                            <div className="px-4 py-8 text-center">
                                <p className="text-sm text-muted-foreground">No recent chats.</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-4 mt-auto">
                    {/* User Profile - Clickable for Settings */}
                    <button 
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-3 px-3 py-3 bg-card hover:bg-card/80 rounded-xl mb-3 border border-border/20 shadow-sm transition-all text-left"
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm ring-2 ring-white/10 shrink-0">
                            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold truncate leading-none mb-1">{session?.user?.name}</p>
                            <p className="text-[10px] text-muted-foreground truncate leading-none font-medium opacity-80">{session?.user?.email}</p>
                        </div>
                        <Settings size={16} className="text-muted-foreground" />
                    </button>
                    
                    <button
                        onClick={() => signOut()}
                        className="flex items-center justify-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-lg transition-colors border border-transparent hover:border-destructive/10"
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>
            </aside>
        </>
    );
}

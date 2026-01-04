'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from './ChatArea';
import { Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';

export function ChatLayout({ initialMessages = [], chatId }: { initialMessages?: any[], chatId?: string }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isMobile, setIsMobile] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);
    const [chatKey, setChatKey] = useState(0);
    const [activeInitialMessages, setActiveInitialMessages] = useState(initialMessages);
    const [activeChatId, setActiveChatId] = useState(chatId);

    // Sync props to state if they change (e.g. navigation)
    useEffect(() => {
        // Only update if we are not explicitly in a "New Chat" triggered state, 
        // OR more simply, always sync if the chatId prop changes, which implies navigation.
        // If the user clicks "New Chat" -> URL becomes /chat (chatId undefined). 
        // If user clicks sidebar history -> URL becomes /chat?id=... (chatId defined).
        // So simply syncing here is safe because "New Chat" click handles its own state, 
        // but if the URL updates later, this effect will pick it up.
        // Wait, "New Chat" sets activeChatId to undefined. If prop is undefined (home), it matches.
        // If I click "New Chat", I do pushState, so props might not change immediately if page doesn't reload.
        // But if I click Sidebar link, page reloads or Next.js transitions, changing props.
        
        setActiveChatId(chatId);
        setActiveInitialMessages(initialMessages);
        setChatKey(prev => prev + 1); // Force re-mount on navigation
    }, [chatId, initialMessages]);

    // Handle responsive sidebar defaults
    useEffect(() => {
        const checkMobile = () => {
            const mobile = window.innerWidth < 768;
            setIsMobile(mobile);
            if (mobile) setIsSidebarOpen(false);
            else setIsSidebarOpen(true);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
    const handleChatUpdate = () => setRefreshKey(prev => prev + 1);

    const handleNewChat = () => {
        setChatKey(prev => prev + 1);
        setActiveInitialMessages([]);
        setActiveChatId(undefined);
        
        if (isMobile) setIsSidebarOpen(false);
        window.history.pushState({}, '', '/chat'); 
    };

    return (
        <div className="flex h-[100dvh] bg-background overflow-hidden relative">
            {/* Sidebar */}
            <Sidebar 
                isOpen={isSidebarOpen} 
                isMobile={isMobile} 
                onClose={() => setIsSidebarOpen(false)} 
                refreshKey={refreshKey}
                onNewChat={handleNewChat}
            />

            {/* Main Content Overlay for Mobile when Sidebar is open */}
            {isMobile && isSidebarOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Chat Area Container */}
            <div className="flex-1 flex flex-col min-w-0 h-full relative transition-all duration-300">
               
                 {/* 
                    We pass the toggle function to ChatArea so it can render the Menu button 
                    in its header.
                 */}
                <ChatArea 
                    key={`${activeChatId}-${chatKey}`}
                    initialMessages={activeInitialMessages} 
                    chatId={activeChatId} 
                    onToggleSidebar={toggleSidebar}
                    isSidebarOpen={isSidebarOpen}
                    onChatUpdate={handleChatUpdate}
                />
            </div>
        </div>
    );
}

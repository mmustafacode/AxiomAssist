'use client';

import { useRef, useEffect, useState } from 'react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Send, Menu, Bot, User, Code, ImageIcon, FileText, Sparkles, Plus, Image as ImageIconLucide, Search, PenTool, Terminal, Loader2, Mic, Flame, RefreshCw, Copy, Check } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatAreaProps {
    initialMessages?: any[];
    chatId?: string;
    onToggleSidebar?: () => void;
    isSidebarOpen?: boolean;
    onChatUpdate?: () => void;
}

function CopyButton({ content }: { content: string }) {
    const [isCopied, setIsCopied] = useState(false);

    const copy = async () => {
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(content);
                setIsCopied(true);
            } else {
                // Fallback for non-secure contexts (mobile dev)
                const textArea = document.createElement("textarea");
                textArea.value = content;
                
                // Ensure it's not visible but part of DOM
                textArea.style.position = "fixed";
                textArea.style.left = "-9999px";
                textArea.style.top = "0";
                document.body.appendChild(textArea);
                
                textArea.focus();
                textArea.select();
                
                try {
                    document.execCommand('copy');
                    setIsCopied(true);
                } catch (err) {
                    console.error('Fallback: Oops, unable to copy', err);
                }
                
                document.body.removeChild(textArea);
            }
            setTimeout(() => setIsCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy class: ', err);
        }
    };

    return (
        <button 
            onClick={copy} 
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-md transition-colors"
            title="Copy response"
        >
            {isCopied ? <Check size={14} /> : <Copy size={14} />}
        </button>
    );
}

export function ChatArea({ initialMessages = [], chatId, onToggleSidebar, isSidebarOpen, onChatUpdate }: ChatAreaProps) {
    const { data: session } = useSession();
    const scrollRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const searchParams = useSearchParams();
    const idFromUrl = searchParams.get('id');
    
    const [messages, setMessages] = useState<any[]>(initialMessages);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Initial load sync
    useEffect(() => {
        if (initialMessages && initialMessages.length > 0) {
            setMessages(initialMessages);
        }
    }, [initialMessages]);

    // Scroll handling
    useEffect(() => {
        if (scrollRef.current) {
            const scrollElement = scrollRef.current;
            setTimeout(() => {
                scrollElement.scrollTo({ top: scrollElement.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isLoading, selectedImage]);

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearImage = () => {
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if ((!input.trim() && !selectedImage) || isLoading) return;

        const userContent = selectedImage 
            ? [
                { type: "text", text: input },
                { type: "image_url", image_url: { url: selectedImage } }
              ]
            : input;

        const currentInput = input;
        const currentImage = selectedImage;

        setInput('');
        setSelectedImage(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        // Optimistic UI update
        const userMessage = { 
            id: Date.now().toString(), 
            role: 'user', 
            content: userContent 
        };
        
        // Create placeholder for assistant
        const assistantId = (Date.now() + 1).toString();
        let assistantPlaceholder = {
            id: assistantId,
            role: 'assistant',
            content: '',
        };

        setMessages(prev => [...prev, userMessage, assistantPlaceholder]);
        setIsLoading(true);

        try {
            // Use the updated messages array for the API call
            const messagesForApi = [...messages, userMessage];

            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: messagesForApi,
                    chatId: chatId || idFromUrl,
                    userId: (session?.user as any)?.id
                })
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || "Network response was not ok");
            }
            if (!response.body) throw new Error("No response body");

            // Trigger sidebar refresh on first successful response
            if (onChatUpdate) onChatUpdate();

            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let accumulatedText = "";

            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunkValue = decoder.decode(value, { stream: true });
                accumulatedText += chunkValue;

                // Update the last message (assistant placeholder) with accumulated text
                setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg.id === assistantId) {
                        lastMsg.content = accumulatedText;
                    }
                    return newMessages;
                });
            }

        } catch (error: any) {
            console.error("Chat Error:", error);
            // Show exact error from server if available
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `**Error:** ${error.message || 'Failed to get response. Please try again.'}`
            }]);
        } finally {
            setIsLoading(false);
            // Auto-focus input for desktop experience
            setTimeout(() => {
                const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
                if (textarea && window.innerWidth > 768) { // Simple check for likely desktop
                    textarea.focus();
                }
            }, 100);
        }
    };

    if (!session) return null;

    const emptyState = messages.length === 0;

    const renderMessageContent = (content: any) => {
        if (Array.isArray(content)) {
            return (
                <div className="space-y-2">
                    {content.map((part, idx) => {
                        if (part.type === 'text') {
                            return <div key={idx} className="whitespace-pre-wrap">{part.text}</div>;
                        }
                        if (part.type === 'image_url') {
                            return (
                                <div key={idx} className="rounded-lg overflow-hidden my-2 max-w-[300px] border border-border shadow-sm">
                                    <img src={part.image_url.url} alt="User Upload" className="w-full h-auto" />
                                </div>
                            );
                        }
                        return null;
                    })}
                </div>
            );
        }
        return <div className="whitespace-pre-wrap">{content}</div>;
    };

    return (
        <div className="flex flex-col h-full bg-background relative w-full">
            {/* Minimal Header */}
            <header className="h-14 shrink-0 px-4 flex items-center justify-between z-30 sticky top-0 bg-background/80 backdrop-blur-md">
                <div className="flex items-center gap-2">
                    {!isSidebarOpen && (
                        <>
                            {onToggleSidebar && (
                                <button onClick={onToggleSidebar} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
                                    <Menu size={20} />
                                </button>
                            )}
                            <div className="flex items-center gap-1.5 opacity-90 hover:opacity-100 transition-opacity cursor-default">
                                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">AxiomAssist</span>
                                <div className="text-[10px] bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded-full font-medium border border-blue-500/20">Beta</div>
                            </div>
                        </>
                    )}
                </div>
                <div>
                     {messages.length > 0 && !isLoading && (
                        <button 
                            onClick={() => setMessages([])} 
                            className="p-2 hover:bg-secondary rounded-full text-muted-foreground transition-colors"
                            title="Clear Chat"
                        >
                            <RefreshCw size={18} />
                        </button>
                    )}
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto w-full relative" ref={scrollRef}>
                {emptyState ? (
                    <div className="flex flex-col items-center justify-center min-h-full p-4 pb-20 fade-in animate-in duration-700 slide-in-from-bottom-4">
                        <div className="mb-8 text-center space-y-2">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-red-500 pb-2">
                                Hello, {session.user?.name?.split(' ')[0] || 'There'}
                            </h1>
                            <p className="text-lg text-muted-foreground font-light">How can I help you today?</p>
                        </div>
                        
                        {/* Centered Input for Empty State */}
                        <div className="w-full max-w-2xl px-4 mb-8">
                             <form onSubmit={handleSubmit} className="relative">
                                {/* Image Preview in Empty State */}
                                {selectedImage && (
                                    <div className="absolute -top-24 left-0 bg-background border border-border rounded-xl p-2 shadow-lg animate-in fade-in zoom-in duration-200">
                                        <div className="relative">
                                            <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                                            <button 
                                                type="button"
                                                onClick={clearImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            >
                                                <Plus size={14} className="rotate-45" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                <div className="relative bg-secondary/50 border border-border/50 hover:border-primary/20 backdrop-blur-xl rounded-2xl overflow-hidden shadow-sm transition-all focus-within:shadow-md focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary/30">
                                    <textarea
                                        ref={(ref) => {
                                            if (ref) {
                                                ref.style.height = 'auto';
                                                ref.style.height = `${Math.min(ref.scrollHeight, 200)}px`;
                                            }
                                        }}
                                        className="w-full bg-transparent text-foreground placeholder:text-muted-foreground/60 px-5 py-4 pr-14 focus:outline-none text-base resize-none max-h-[200px] overflow-y-auto"
                                        value={input}
                                        onChange={(e) => {
                                            setInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        placeholder="Message AxiomAssist..."
                                        disabled={isLoading}
                                        autoFocus
                                        rows={1}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                        <input 
                                            type="file" 
                                            ref={fileInputRef}
                                            className="hidden" 
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className={cn(
                                                "p-2 rounded-xl transition-all",
                                                selectedImage ? "text-primary bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                            )}
                                            title="Upload Image"
                                        >
                                           <ImageIcon size={20} />
                                        </button>
                                        <button 
                                            type="submit"
                                            disabled={(!input.trim() && !selectedImage) || isLoading}
                                            className="p-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                        >
                                            {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                                        </button>
                                    </div>
                                </div>
                             </form>
                             <div className="text-center mt-2.5">
                                <p className="text-[10px] text-muted-foreground/60">
                                    AI can make mistakes. Check important info.
                                </p>
                             </div>
                        </div>

                             <div className="flex gap-2 justify-center mt-8 flex-wrap">
                                 {[
                                     { label: "Create image", icon: <ImageIconLucide size={14} className="text-blue-400" /> },
                                     { label: "Surprise me", icon: <Sparkles size={14} className="text-yellow-400" /> },
                                     { label: "Analyze code", icon: <Flame size={14} className="text-orange-400" /> },
                                     { label: "Draft email", icon: <Bot size={14} className="text-green-400" /> }
                                 ].map((chip) => (
                                     <button
                                         key={chip.label}
                                         onClick={() => {
                                             setInput(chip.label);
                                         }}
                                         className="flex items-center gap-2 px-4 py-2 bg-secondary/50 hover:bg-secondary border border-transparent hover:border-border rounded-full text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
                                     >
                                         <span className="p-1 rounded-full bg-background/50">{chip.icon}</span>
                                         <span>{chip.label}</span>
                                     </button>
                                 ))}
                             </div>
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">
                        {messages.map((m: any, index: number) => {
                             if (m.role === 'assistant' && !m.content && !isLoading) return null;
                            return (
                                <motion.div
                                    key={m.id || index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={cn(
                                        "flex gap-5 w-full",
                                    )}
                                >
                                    {/* Avatars */}
                                    <div className="shrink-0 mt-1">
                                        {m.role === 'user' ? (
                                             <div className="w-9 h-9 rounded-full bg-gradient-to-b from-cyan-400 to-lime-400 p-[2px] shadow-sm">
                                                 <div className="w-full h-full rounded-full bg-blue-50 flex items-center justify-center font-bold text-xs text-black uppercase">
                                                     {session.user?.name?.[0] || <User size={14} />}
                                                 </div>
                                             </div>
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                                                <Sparkles size={16} className="text-white" />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 space-y-1">
                                         <div className="font-semibold text-sm opacity-90 mb-1 capitalize">
                                            {m.role === 'user' ? (session.user?.name || 'You') : (
                                                <span className="bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent font-bold">AxiomAssist</span>
                                            )}
                                         </div>
                                         <div className={cn(
                                             "text-[15px] leading-7 text-foreground/90 font-urdu",
                                             m.role === 'assistant' ? "markdown-content" : ""
                                         )}>
                                            {m.role === 'user' ? (
                                                renderMessageContent(m.content)
                                            ) : (
                                                <div>
                                                    {m.content ? (
                                                        <div className="group">
                                                            <MarkdownRenderer content={m.content} />
                                                            <div className="flex items-center gap-2 mt-2 transition-opacity duration-200">
                                                                <CopyButton content={m.content} />
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1.5 h-6 opacity-50">
                                                            <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse"></span>
                                                            <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse [animation-delay:0.2s]"></span>
                                                            <span className="w-1.5 h-1.5 bg-foreground rounded-full animate-pulse [animation-delay:0.4s]"></span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                         </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Sticky Input Bar for Chat State */}
            {!emptyState && (
                <footer className="shrink-0 p-4 pt-2 bg-gradient-to-t from-background via-background to-transparent z-20">
                     <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto flex items-center bg-secondary/50 rounded-2xl border border-border/50 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50 transition-all shadow-sm">
                                {/* Image Preview in Footer */}
                                {selectedImage && (
                                    <div className="absolute -top-24 left-0 bg-background border border-border rounded-xl p-2 shadow-lg animate-in fade-in zoom-in duration-200">
                                        <div className="relative">
                                            <img src={selectedImage} alt="Preview" className="h-20 w-auto rounded-lg object-cover" />
                                            <button 
                                                type="button"
                                                onClick={clearImage}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                            >
                                                <Plus size={14} className="rotate-45" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleImageSelect}
                                />
                                    <button 
                                        type="button" 
                                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                                        className={cn(
                                            "ml-3 p-1.5 rounded-full transition-colors",
                                            isMenuOpen ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                        )}
                                        title="More Options"
                                    >
                                         <Plus size={20} className={cn("transition-transform duration-200", isMenuOpen ? "rotate-45" : "")} />
                                    </button>

                                    <AnimatePresence>
                                        {isMenuOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute bottom-full left-0 mb-3 ml-2 bg-background/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl overflow-hidden min-w-[180px] p-1.5 z-50"
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        fileInputRef.current?.click();
                                                        setIsMenuOpen(false);
                                                    }}
                                                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-secondary/80 rounded-lg text-sm transition-colors text-left"
                                                >
                                                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                                                        <ImageIcon size={16} />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-foreground">Upload Image</div>
                                                        <div className="text-[10px] text-muted-foreground">Analyze visual content</div>
                                                    </div>
                                                </button>
                                                
                                                {/* More options can be added here easily */}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                    <textarea
                                        ref={(ref) => {
                                            if (ref) {
                                                ref.style.height = 'auto';
                                                ref.style.height = `${Math.min(ref.scrollHeight, 200)}px`;
                                            }
                                        }}
                                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/70 px-3 py-3 focus:outline-none text-sm resize-none max-h-[200px] overflow-y-auto"
                                        value={input}
                                        onChange={(e) => {
                                            setInput(e.target.value);
                                            e.target.style.height = 'auto';
                                            e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSubmit(e);
                                            }
                                        }}
                                        placeholder="Message AxiomAssist..."
                                        disabled={isLoading}
                                        autoFocus
                                        rows={1}
                                    />
                                <button
                                    type="submit"
                                    disabled={isLoading || (!input.trim() && !selectedImage)}
                                    className="mr-2 p-2 bg-primary text-primary-foreground rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} className="ml-0.5" />}
                                </button>

                        </form>
                         <div className="text-center mt-3 text-[10px] text-muted-foreground/60 pb-2">
                            AI can make mistakes. Check important info.
                        </div>
                     </div>
                </footer>
            )}
        </div>
    );
}

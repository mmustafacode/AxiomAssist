'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Trash2, Moon, Sun, Monitor, AlertTriangle, Loader2 } from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';

// ... imports
// ... imports
import { useTheme } from 'next-themes';
import { ConfirmationModal } from './ConfirmationModal';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const { data: session, update } = useSession();
    const { theme, setTheme } = useTheme();
    const [activeTab, setActiveTab] = useState<'general' | 'data'>('general');
    const [name, setName] = useState(session?.user?.name || '');
    const [isUpdating, setIsUpdating] = useState(false);
    
    // Confirmation State
    const [confirmAction, setConfirmAction] = useState<{ type: 'history' | 'account', isOpen: boolean }>({ type: 'history', isOpen: false });

    // Note: handleThemeChange removed, using setTheme directly in JSX.

    useEffect(() => {
        if (session?.user?.name && !name) {
            setName(session.user.name);
        }
    }, [session, name]);

    // ... handleUpdateProfile ...
    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUpdating(true);
        try {
            const res = await fetch('/api/user', {
                method: 'PATCH',
                body: JSON.stringify({ name }),
            });
            if (res.ok) {
                await update({ name });
                onClose();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
        }
    };
    // ... executeDelete ...
    const executeDelete = async () => {
        setIsUpdating(true);
        try {
            if (confirmAction.type === 'history') {
                // @ts-ignore
                await fetch(`/api/history?deleteAll=true&userId=${session?.user?.id}`, { method: 'DELETE' });
                window.location.reload();
            } else if (confirmAction.type === 'account') {
                await fetch('/api/user', { method: 'DELETE' });
                signOut();
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsUpdating(false);
            setConfirmAction({ ...confirmAction, isOpen: false });
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60]"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-background rounded-2xl shadow-2xl z-[70] overflow-hidden border border-border/10"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 px-6 border-b border-border/5 bg-secondary/20">
                            <h2 className="text-lg font-semibold tracking-tight">Settings</h2>
                            <button onClick={onClose} className="p-2 hover:bg-black/5 dark:hover:bg-white/10 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>

                        {/* Tabs */}
                        <div className="flex px-6 pt-2 border-b border-border/5">
                            {(['general', 'data'] as const).map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={cn(
                                        "flex-1 py-3 text-sm font-medium border-b-2 transition-all capitalize",
                                        activeTab === tab ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
                                    )}
                                >
                                    {tab === 'data' ? 'Data Controls' : tab}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 min-h-[320px]">
                            {activeTab === 'general' ? (
                                <div className="space-y-6">
                                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Display Name</label>
                                            <div className="relative group">
                                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={16} />
                                                <input
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    className="w-full pl-10 pr-4 py-3 bg-secondary/30 hover:bg-secondary/50 focus:bg-background border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/50"
                                                    placeholder="Your Name"
                                                />
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interface Theme</label>
                                            <div className="grid grid-cols-3 gap-3">
                                                {['light', 'dark', 'system'].map((t) => (
                                                    <button
                                                        key={t}
                                                        type="button"
                                                        onClick={() => setTheme(t)}
                                                        className={cn(
                                                            "flex flex-col items-center gap-2 p-3 rounded-xl transition-all border border-transparent",
                                                            theme === t 
                                                                ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-inner" 
                                                                : "bg-secondary/30 hover:bg-secondary/60 text-muted-foreground hover:text-foreground"
                                                        )}
                                                    >
                                                        {t === 'light' && <Sun size={20} />}
                                                        {t === 'dark' && <Moon size={20} />}
                                                        {t === 'system' && <Monitor size={20} />}
                                                        <span className="text-xs capitalize font-medium">{t}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isUpdating || name === session?.user?.name}
                                            className="w-full py-3 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-50 transition-all font-medium flex items-center justify-center gap-2 mt-4 shadow-lg shadow-primary/20"
                                        >
                                            {isUpdating ? <Loader2 className="animate-spin" size={16} /> : 'Save Changes'}
                                        </button>
                                    </form>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-5 rounded-2xl bg-orange-500/5 hover:bg-orange-500/10 transition-colors space-y-3 group">
                                        <div className="flex items-center gap-3 text-orange-600 dark:text-orange-400 font-semibold text-sm">
                                            <div className="p-2 bg-orange-500/10 rounded-lg group-hover:bg-orange-500/20 transition-colors">
                                                <Trash2 size={16} />
                                            </div>
                                            Clear Chat History
                                        </div>
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed pl-11">
                                            Permanently remove all your chat sessions. This action cannot be undone.
                                        </p>
                                        <div className="pl-11">
                                            <button 
                                                onClick={() => setConfirmAction({ type: 'history', isOpen: true })}
                                                className="px-4 py-2 text-xs font-medium bg-background hover:bg-white dark:hover:bg-black/50 border border-orange-500/20 rounded-lg transition-all text-foreground shadow-sm"
                                            >
                                                Delete All Chats
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 rounded-2xl bg-destructive/5 hover:bg-destructive/10 transition-colors space-y-3 group">
                                        <div className="flex items-center gap-3 text-destructive font-semibold text-sm">
                                            <div className="p-2 bg-destructive/10 rounded-lg group-hover:bg-destructive/20 transition-colors">
                                                <AlertTriangle size={16} />
                                            </div>
                                            Delete Account
                                        </div>
                                        <p className="text-xs text-muted-foreground/80 leading-relaxed pl-11">
                                            Permanently delete your account and all associated data.
                                        </p>
                                        <div className="pl-11">
                                            <button 
                                                onClick={() => setConfirmAction({ type: 'account', isOpen: true })}
                                                className="px-4 py-2 text-xs font-medium bg-destructive text-destructive-foreground hover:opacity-90 rounded-lg transition-all shadow-sm shadow-destructive/20"
                                            >
                                                Delete Account
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>

                    <ConfirmationModal 
                        isOpen={confirmAction.isOpen}
                        onClose={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                        onConfirm={executeDelete}
                        title={confirmAction.type === 'history' ? "Clear All History" : "Delete Account"}
                        description={confirmAction.type === 'history' 
                            ? "Are you sure you want to delete ALL chat conversations? This cannot be undone." 
                            : "Are you sure you want to delete your account? All data will be permanently lost."}
                        confirmText="Delete Permanently"
                        isDangerous
                        isLoading={isUpdating}
                    />
                </>
            )}
        </AnimatePresence>
    );
}

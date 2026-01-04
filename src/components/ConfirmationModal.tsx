'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void | Promise<void>;
    title: string;
    description: string;
    confirmText?: string;
    isDangerous?: boolean;
    isLoading?: boolean;
}

export function ConfirmationModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title, 
    description, 
    confirmText = "Confirm", 
    isDangerous = false, 
    isLoading = false 
}: ConfirmationModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />
                
                {/* Modal */}
                <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="relative w-full max-w-sm bg-background/90 backdrop-blur-xl border border-border/5 rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="p-6 text-center space-y-4">
                        <div className="mx-auto w-12 h-12 bg-destructive/5 rounded-full flex items-center justify-center text-destructive mb-2 ring-4 ring-destructive/5">
                            <AlertTriangle size={24} />
                        </div>
                        
                        <div className="space-y-1">
                            <h3 className="text-lg font-semibold">{title}</h3>
                            <p className="text-sm text-muted-foreground">{description}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 pt-2">
                            <button 
                                onClick={onClose}
                                disabled={isLoading}
                                className="px-4 py-2.5 text-sm font-medium bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={onConfirm}
                                disabled={isLoading}
                                className={cn(
                                    "px-4 py-2.5 text-sm font-medium text-white rounded-xl transition-all shadow-md flex items-center justify-center gap-2",
                                    isDangerous 
                                    ? "bg-red-600 hover:bg-red-700 shadow-red-500/20" 
                                    : "bg-primary hover:bg-primary/90 shadow-primary/20"
                                )}
                            >
                                {isLoading ? <Loader2 size={16} className="animate-spin" /> : confirmText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}

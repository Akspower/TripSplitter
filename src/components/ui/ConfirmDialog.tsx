import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmDialogProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, title, message, confirmText = 'Confirm', cancelText = 'Cancel', isDestructive = false, onConfirm, onCancel
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-black/70 backdrop-blur-md"
                    />
                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 10 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="glass-card w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden border border-white/10"
                    >
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#b613ec]/10 rounded-full blur-2xl pointer-events-none" />

                        <div className="relative flex flex-col items-center text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                                className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDestructive ? 'bg-rose-400/10 border border-rose-400/20' : 'bg-[#b613ec]/10 border border-[#b613ec]/20'}`}
                            >
                                <span className={`material-symbols-outlined text-3xl ${isDestructive ? 'text-rose-400' : 'text-[#b613ec]'}`}>
                                    {isDestructive ? 'warning' : 'info'}
                                </span>
                            </motion.div>

                            <h3 className="text-xl font-bold text-[#F4F4F8] tracking-tight">{title}</h3>
                            <p className="text-[rgba(244,244,248,0.5)] font-medium leading-relaxed text-sm">{message}</p>

                            <div className="grid grid-cols-2 gap-3 w-full pt-2">
                                <button onClick={onCancel}
                                    className="py-3.5 rounded-2xl font-bold text-[rgba(244,244,248,0.4)] glass-pill border border-white/10 text-sm hover:text-[#F4F4F8] transition-colors">
                                    {cancelText}
                                </button>
                                <button onClick={onConfirm}
                                    className={`py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 ${isDestructive
                                            ? 'bg-rose-500 shadow-lg shadow-rose-500/25 hover:bg-rose-600'
                                            : 'bg-[#b613ec] shadow-lg shadow-[#b613ec]/25 hover:bg-[#c520f8]'
                                        }`}>
                                    {confirmText}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default ConfirmDialog;

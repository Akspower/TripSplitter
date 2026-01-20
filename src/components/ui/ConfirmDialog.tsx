import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

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
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    isDestructive = false,
    onConfirm,
    onCancel
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
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white/95 backdrop-blur-xl w-full max-w-sm rounded-[32px] p-6 shadow-2xl relative z-10 overflow-hidden border border-white/50"
                    >
                        {/* Decorative background blob */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl"></div>

                        <div className="relative flex flex-col items-center text-center space-y-4">
                            <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                className={`w-20 h-20 rounded-[24px] flex items-center justify-center mb-2 shadow-inner ${isDestructive ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}
                            >
                                <ExclamationTriangleIcon className="w-10 h-10" />
                            </motion.div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {title}
                            </h3>

                            <p className="text-slate-500 font-medium leading-relaxed">
                                {message}
                            </p>

                            <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                <button
                                    onClick={onCancel}
                                    className="py-3 px-6 rounded-2xl font-bold text-slate-500 hover:bg-slate-100 transition-colors active:scale-95 duration-200"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`py-3 px-6 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 duration-200 flex items-center justify-center gap-2 ${isDestructive
                                        ? 'bg-rose-500 shadow-rose-200 hover:bg-rose-600'
                                        : 'bg-indigo-600 shadow-indigo-200 hover:bg-indigo-700'
                                        }`}
                                >
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

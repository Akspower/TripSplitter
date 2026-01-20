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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onCancel}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    {/* Dialog */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl relative z-10 overflow-hidden"
                    >
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-2 ${isDestructive ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'}`}>
                                <ExclamationTriangleIcon className="w-8 h-8" />
                            </div>

                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                                {title}
                            </h3>

                            <p className="text-slate-500 font-medium leading-relaxed">
                                {message}
                            </p>

                            <div className="grid grid-cols-2 gap-3 w-full pt-4">
                                <button
                                    onClick={onCancel}
                                    className="py-3.5 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors active:scale-95 duration-200"
                                >
                                    {cancelText}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    className={`py-3.5 rounded-2xl font-black text-white shadow-lg transition-all active:scale-95 duration-200 ${isDestructive
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

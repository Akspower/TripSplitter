import React, { useState } from 'react';
import type { Member, Expense, ExpenseCategory } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { value: ExpenseCategory; emoji: string; label: string }[] = [
    { value: 'Food', emoji: '🍛', label: 'Food' },
    { value: 'Drink', emoji: '🥤', label: 'Drink' },
    { value: 'Alcohol', emoji: '🍺', label: 'Alcohol' },
    { value: 'Cab/Taxi', emoji: '🚕', label: 'Taxi' },
    { value: 'Train/Bus/Flight', emoji: '✈️', label: 'Travel' },
    { value: 'Hotel/Stay', emoji: '🏨', label: 'Hotel' },
    { value: 'Entry Fee', emoji: '🎟️', label: 'Entry' },
    { value: 'Trekking Gear', emoji: '🥾', label: 'Trek' },
    { value: 'Shopping', emoji: '🛍️', label: 'Shop' },
    { value: 'Other', emoji: '📍', label: 'Other' },
];

const gradients = [
    'from-violet-500 to-[#b613ec]', 'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600', 'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-600', 'from-cyan-400 to-blue-500',
];

const ExpenseForm: React.FC<{
    members: Member[];
    onAdd: (e: Expense) => void;
    onCancel: () => void;
    initialData?: Expense;
}> = ({ members, onAdd, onCancel, initialData }) => {
    const [desc, setDesc] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount.toString() || '');
    const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'Food');
    const [payerId, setPayerId] = useState(initialData?.payerId || '');
    const [participantIds, setParticipantIds] = useState<string[]>(initialData?.participantIds || members.map(m => m.id));
    const [saving, setSaving] = useState(false);
    const [splitType, setSplitType] = useState<'EQUAL' | 'EXACT'>(initialData?.splitType || 'EQUAL');
    const [splitDetails, setSplitDetails] = useState<Record<string, number>>(initialData?.splitDetails || {});

    const currentSplitSum = Object.values(splitDetails).reduce((a, b) => a + b, 0);

    const toggleParticipant = (id: string) =>
        setParticipantIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

    const toggleAll = () =>
        setParticipantIds(participantIds.length === members.length ? [] : members.map(m => m.id));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!desc.trim()) { toast.error('Please enter a description'); return; }
        if (desc.trim().length > 100) { toast.error('Description too long (max 100 chars)'); return; }
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) { toast.error('Please enter a valid amount'); return; }
        if (numAmount > 1000000) { toast.error('Amount seems too high'); return; }
        if (!payerId) { toast.error('Who paid for this?', { icon: '💸', duration: 4000 }); return; }

        if (splitType === 'EXACT') {
            if (Math.abs(currentSplitSum - numAmount) > 0.5) {
                toast.error(`Split (₹${currentSplitSum.toFixed(0)}) ≠ Bill (₹${numAmount.toFixed(0)})`); return;
            }
            const involvedIds = Object.keys(splitDetails).filter(id => splitDetails[id] > 0);
            if (!involvedIds.length) { toast.error('Split the amount among members'); return; }
            setSaving(true);
            onAdd({ id: initialData?.id || '', description: desc.trim(), amount: numAmount, date: initialData?.date || new Date().toISOString(), category, payerId, participantIds: involvedIds, createdBy: initialData?.createdBy || '', splitType: 'EXACT', splitDetails });
            return;
        }

        if (!participantIds.length) { toast.error('Select at least one person', { icon: '👥', duration: 4000 }); return; }
        setSaving(true);
        onAdd({ id: initialData?.id || '', description: desc.trim(), amount: numAmount, date: initialData?.date || new Date().toISOString(), category, payerId, participantIds, createdBy: initialData?.createdBy || '', splitType: 'EQUAL' });
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md"
                onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
            >
                <motion.div
                    initial={{ y: '100%', opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: '100%', opacity: 0 }}
                    transition={{ type: 'spring', damping: 28, stiffness: 300 }}
                    className="w-full max-w-xl bg-[#0d0817]/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Handle */}
                    <div className="flex flex-col items-center pt-3 pb-1 sm:hidden">
                        <div className="w-12 h-1.5 rounded-full bg-white/15" />
                    </div>

                    <div className="p-5 sm:p-7 space-y-6 max-h-[90vh] overflow-y-auto pb-10">
                        {/* Header */}
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-[#b613ec] text-[10px] font-bold uppercase tracking-widest">
                                    {initialData ? 'Edit Expense' : 'Add Expense'}
                                </p>
                                <h3 className="text-2xl font-bold text-[#F4F4F8] tracking-tight">Expense Details</h3>
                            </div>
                            <button type="button" onClick={onCancel}
                                className="w-9 h-9 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.4)] hover:text-[#F4F4F8] transition-colors">
                                <span className="material-symbols-outlined text-lg">close</span>
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Category scroll */}
                            <div className="flex gap-3 -mx-1 px-1 overflow-x-auto no-scrollbar py-1">
                                {CATEGORIES.map(cat => (
                                    <button key={cat.value} type="button" onClick={() => setCategory(cat.value)}
                                        className={`flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-sm font-medium transition-all duration-200 ${category === cat.value
                                            ? 'bg-[#b613ec] text-white shadow-lg shadow-[#b613ec]/30 border-t border-white/20'
                                            : 'glass-pill text-[rgba(244,244,248,0.5)] hover:text-[#F4F4F8]'
                                            }`}
                                    >
                                        <span>{cat.emoji}</span> {cat.label}
                                    </button>
                                ))}
                            </div>

                            {/* Amount input — big */}
                            <div className="text-center py-2">
                                <span className="text-[rgba(244,244,248,0.35)] text-xs font-bold tracking-widest uppercase mb-1 block">Amount (₹)</span>
                                <div className="flex items-center justify-center gap-1">
                                    <span className="text-[rgba(244,244,248,0.3)] text-4xl font-light">₹</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        placeholder="0"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        className="bg-transparent border-none text-5xl font-bold text-[#F4F4F8] w-40 text-center focus:outline-none focus:ring-0 p-0 placeholder:text-[rgba(244,244,248,0.2)]"
                                        autoFocus={!initialData}
                                    />
                                    <div className="w-0.5 h-10 bg-[#b613ec] rounded-full animate-pulse" />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-[rgba(244,244,248,0.4)] text-xs font-bold tracking-widest uppercase px-1">Description</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        maxLength={100}
                                        placeholder="What was it for?"
                                        value={desc}
                                        onChange={e => setDesc(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-[#F4F4F8] placeholder:text-[rgba(244,244,248,0.25)] focus:outline-none focus:ring-2 focus:ring-[#b613ec]/40 font-medium text-sm"
                                    />
                                    <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-[rgba(244,244,248,0.2)] text-lg">edit_note</span>
                                </div>
                            </div>

                            {/* Who Paid */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-end px-1">
                                    <label className="text-[rgba(244,244,248,0.4)] text-xs font-bold tracking-widest uppercase">Who Paid?</label>
                                    {payerId && <span className="text-[#b613ec] text-xs font-bold">{members.find(m => m.id === payerId)?.name}</span>}
                                </div>
                                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                                    {members.map((m, i) => (
                                        <button key={m.id} type="button" onClick={() => setPayerId(m.id)}
                                            className="flex-col flex items-center gap-2 shrink-0"
                                        >
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-white text-lg transition-all ${payerId === m.id
                                                ? `ring-3 ring-[#b613ec] ring-offset-3 ring-offset-[#0d0817] bg-gradient-to-br ${gradients[i % gradients.length]}`
                                                : `bg-gradient-to-br ${gradients[i % gradients.length]} opacity-40`
                                                }`}>
                                                {m.name.charAt(0).toUpperCase()}
                                            </div>
                                            <span className={`text-[10px] font-bold uppercase tracking-wide ${payerId === m.id ? 'text-[#b613ec]' : 'text-[rgba(244,244,248,0.3)]'}`}>
                                                {m.name.split(' ')[0]}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Split Type toggle */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center px-1">
                                    <label className="text-[rgba(244,244,248,0.4)] text-xs font-bold tracking-widest uppercase">Split With</label>
                                    <div className="flex glass-pill rounded-xl p-1 border border-white/10">
                                        {(['EQUAL', 'EXACT'] as const).map(t => (
                                            <button key={t} type="button" onClick={() => setSplitType(t)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${splitType === t ? 'bg-[#b613ec] text-white shadow-sm' : 'text-[rgba(244,244,248,0.35)]'}`}>
                                                {t === 'EQUAL' ? 'Equally' : 'Exact'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {splitType === 'EQUAL' ? (
                                    <>
                                        <div className="flex justify-end pr-1">
                                            <button type="button" onClick={toggleAll}
                                                className="text-[10px] font-bold text-[#b613ec] uppercase tracking-widest hover:opacity-70 transition-opacity">
                                                {participantIds.length === members.length ? 'Deselect All' : 'Select All'}
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2.5">
                                            {members.map((m) => {
                                                const selected = participantIds.includes(m.id);
                                                return (
                                                    <button key={m.id} type="button" onClick={() => toggleParticipant(m.id)}
                                                        className={`flex items-center justify-between px-4 py-3 rounded-2xl border transition-all duration-200 ${selected
                                                            ? 'bg-[#b613ec]/15 border-[#b613ec]/40'
                                                            : 'bg-white/5 border-white/5'
                                                            }`}
                                                    >
                                                        <span className={`text-sm font-medium ${selected ? 'text-[#F4F4F8]' : 'text-[rgba(244,244,248,0.4)]'}`}>
                                                            {m.name.split(' ')[0]}
                                                        </span>
                                                        <span className={`material-symbols-outlined text-lg ${selected ? 'text-[#b613ec]' : 'text-[rgba(244,244,248,0.2)]'}`}>
                                                            {selected ? 'check_circle' : 'radio_button_unchecked'}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                                        {members.map(m => (
                                            <div key={m.id} className="flex items-center justify-between">
                                                <span className={`text-sm font-medium ${(splitDetails[m.id] || 0) > 0 ? 'text-[#F4F4F8]' : 'text-[rgba(244,244,248,0.4)]'}`}>{m.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-[rgba(244,244,248,0.25)]">₹</span>
                                                    <input type="number" placeholder="0"
                                                        className="w-24 bg-white/10 rounded-xl px-3 py-2 text-right font-bold focus:ring-2 focus:ring-[#b613ec]/40 outline-none text-[#F4F4F8] text-sm"
                                                        value={splitDetails[m.id] || ''}
                                                        onChange={e => setSplitDetails(prev => ({ ...prev, [m.id]: parseFloat(e.target.value) || 0 }))}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                        <div className={`pt-3 border-t border-white/10 flex justify-between text-xs font-bold uppercase tracking-widest ${Math.abs(currentSplitSum - parseFloat(amount || '0')) < 0.1 ? 'text-emerald-400' : 'text-rose-400'
                                            }`}>
                                            <span>Split: ₹{currentSplitSum.toFixed(0)}</span>
                                            <span>Bill: ₹{parseFloat(amount || '0').toFixed(0)}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Submit */}
                            <div className="pt-2">
                                <motion.button
                                    type="submit"
                                    disabled={saving}
                                    whileTap={{ scale: 0.97 }}
                                    className="w-full btn-primary py-5 rounded-full flex items-center justify-center gap-2 font-bold text-lg disabled:opacity-60"
                                >
                                    <span>{saving ? 'Saving...' : initialData ? 'Update Expense' : 'Add Expense'}</span>
                                    <span className="material-symbols-outlined">receipt_long</span>
                                </motion.button>
                                <p className="text-center text-[rgba(244,244,248,0.2)] text-[10px] mt-3 uppercase tracking-widest">Powered by SplitWay</p>
                            </div>
                        </form>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ExpenseForm;

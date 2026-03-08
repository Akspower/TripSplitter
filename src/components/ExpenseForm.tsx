import React, { useState, useCallback } from 'react';
import type { Member, Expense, ExpenseCategory } from '../types';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

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

    // Stable callbacks — prevent re-render on every keystroke
    const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        // Only allow digits and one decimal point — prevents numeric keyboard black-box issue on iOS
        const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
        setAmount(val);
    }, []);

    const toggleParticipant = useCallback((id: string) =>
        setParticipantIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]), []);

    const toggleAll = useCallback(() =>
        setParticipantIds(prev => prev.length === members.length ? [] : members.map(m => m.id)), [members]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
        // Overlay — no AnimatePresence here to prevent the lazy-Suspense remount flash
        <div
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            style={{ WebkitTapHighlightColor: 'transparent' }}
            onPointerDown={e => { if (e.target === e.currentTarget) onCancel(); }}
        >
            <motion.div
                initial={{ y: '100%', opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: '100%', opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                // willChange prevents iOS blank/black flash during keyboard appearance
                style={{ willChange: 'transform', WebkitOverflowScrolling: 'touch' }}
                className="w-full max-w-xl bg-[#0d0817] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/10 shadow-2xl overflow-hidden"
                onPointerDown={e => e.stopPropagation()}
            >
                {/* Handle bar */}
                <div className="flex flex-col items-center pt-3 pb-1 sm:hidden">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                <div
                    className="p-5 sm:p-7 space-y-5 overflow-y-auto pb-safe-bottom"
                    style={{ maxHeight: 'calc(92dvh - 20px)', overscrollBehavior: 'contain' }}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[#b613ec] text-[10px] font-bold uppercase tracking-widest">
                                {initialData ? 'Edit Expense' : 'Log a Bill'}
                            </p>
                            <h3 className="text-xl font-bold text-[#F4F4F8] tracking-tight">Expense Details</h3>
                        </div>
                        {/* Cancel button — type=button is CRITICAL to avoid form submit on mobile */}
                        <button
                            type="button"
                            onPointerDown={e => { e.stopPropagation(); e.preventDefault(); onCancel(); }}
                            className="w-9 h-9 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.4)] active:text-[#F4F4F8] transition-colors touch-manipulation"
                        >
                            <span className="material-symbols-outlined text-lg">close</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* ── Category Pills — horizontal scroll ── */}
                        <div>
                            <p className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold uppercase tracking-widest mb-2 px-1">Category</p>
                            <div
                                className="flex gap-2 overflow-x-auto pb-1"
                                style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
                            >
                                {CATEGORIES.map(cat => (
                                    <button
                                        key={cat.value}
                                        type="button"
                                        onPointerDown={e => { e.preventDefault(); setCategory(cat.value); }}
                                        className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors touch-manipulation select-none ${category === cat.value
                                            ? 'bg-[#b613ec] text-white shadow-lg shadow-[#b613ec]/25'
                                            : 'bg-white/8 text-[rgba(244,244,248,0.55)] border border-white/8'
                                            }`}
                                    >
                                        <span className="text-sm leading-none">{cat.emoji}</span>
                                        {cat.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Amount — big centered ── */}
                        <div className="text-center py-1">
                            <span className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold tracking-widest uppercase mb-1 block">Amount (₹)</span>
                            <div className="flex items-center justify-center gap-1">
                                <span className="text-[rgba(244,244,248,0.3)] text-3xl font-light select-none">₹</span>
                                <input
                                    // type=text with inputMode=decimal avoids the black iOS toolbar
                                    type="text"
                                    inputMode="decimal"
                                    pattern="[0-9]*\.?[0-9]*"
                                    placeholder="0"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    // NO autoFocus — it triggers keyboard immediately which causes flash
                                    className="bg-transparent border-none text-5xl font-bold text-[#F4F4F8] w-44 text-center focus:outline-none focus:ring-0 p-0 placeholder:text-[rgba(244,244,248,0.2)] caret-[#b613ec]"
                                    style={{ WebkitAppearance: 'none' }}
                                />
                            </div>
                            <div className="w-12 h-0.5 bg-[#b613ec]/50 rounded-full mx-auto mt-1" />
                        </div>

                        {/* ── Description — full width, shows all text ── */}
                        <div className="space-y-1.5">
                            <label className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold tracking-widest uppercase px-1">Description</label>
                            <textarea
                                maxLength={100}
                                rows={2}
                                placeholder="What was it for? (e.g. Dinner at Fisherman's Wharf)"
                                value={desc}
                                onChange={e => setDesc(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-[#F4F4F8] placeholder:text-[rgba(244,244,248,0.2)] focus:outline-none focus:ring-2 focus:ring-[#b613ec]/40 font-medium text-sm resize-none leading-relaxed"
                                style={{ WebkitAppearance: 'none' }}
                            />
                            <div className="flex justify-between px-1">
                                <span className="text-[10px] text-[rgba(244,244,248,0.2)]">Be descriptive — e.g. Lunch at beach shack</span>
                                <span className={`text-[10px] font-bold ${desc.length > 80 ? 'text-amber-400' : 'text-[rgba(244,244,248,0.2)]'}`}>{desc.length}/100</span>
                            </div>
                        </div>

                        {/* ── Who Paid ── */}
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold tracking-widest uppercase">Who Paid?</label>
                                {payerId && <span className="text-[#b613ec] text-xs font-bold">{members.find(m => m.id === payerId)?.name}</span>}
                            </div>
                            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                                {members.map((m, i) => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onPointerDown={e => { e.preventDefault(); setPayerId(m.id); }}
                                        className="flex-col flex items-center gap-1.5 shrink-0 touch-manipulation select-none"
                                    >
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white text-base transition-all ${payerId === m.id
                                            ? `ring-2 ring-[#b613ec] ring-offset-2 ring-offset-[#0d0817] bg-gradient-to-br ${gradients[i % gradients.length]}`
                                            : `bg-gradient-to-br ${gradients[i % gradients.length]} opacity-35`
                                            }`}>
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className={`text-[10px] font-bold max-w-[48px] text-center leading-tight line-clamp-1 ${payerId === m.id ? 'text-[#b613ec]' : 'text-[rgba(244,244,248,0.3)]'}`}>
                                            {m.name.split(' ')[0]}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* ── Split section ── */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold tracking-widest uppercase">Split With</label>
                                <div className="flex bg-white/5 rounded-xl p-1 border border-white/10">
                                    {(['EQUAL', 'EXACT'] as const).map(t => (
                                        <button
                                            key={t}
                                            type="button"
                                            onPointerDown={e => { e.preventDefault(); setSplitType(t); }}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all touch-manipulation ${splitType === t ? 'bg-[#b613ec] text-white shadow-sm' : 'text-[rgba(244,244,248,0.35)]'}`}
                                        >
                                            {t === 'EQUAL' ? 'Equally' : 'Exact'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {splitType === 'EQUAL' ? (
                                <>
                                    <div className="flex justify-end pr-1">
                                        <button
                                            type="button"
                                            onPointerDown={e => { e.preventDefault(); toggleAll(); }}
                                            className="text-[10px] font-bold text-[#b613ec] uppercase tracking-widest touch-manipulation"
                                        >
                                            {participantIds.length === members.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        {members.map((m) => {
                                            const selected = participantIds.includes(m.id);
                                            return (
                                                <button
                                                    key={m.id}
                                                    type="button"
                                                    onPointerDown={e => { e.preventDefault(); toggleParticipant(m.id); }}
                                                    className={`flex items-center justify-between px-3 py-3 rounded-2xl border transition-colors touch-manipulation select-none ${selected
                                                        ? 'bg-[#b613ec]/15 border-[#b613ec]/40'
                                                        : 'bg-white/5 border-white/5'
                                                        }`}
                                                >
                                                    {/* Show full name, truncate only if very long */}
                                                    <span className={`text-sm font-medium truncate max-w-[80px] ${selected ? 'text-[#F4F4F8]' : 'text-[rgba(244,244,248,0.4)]'}`}>
                                                        {m.name}
                                                    </span>
                                                    <span className={`material-symbols-outlined text-base shrink-0 ml-1 ${selected ? 'text-[#b613ec]' : 'text-[rgba(244,244,248,0.2)]'}`}>
                                                        {selected ? 'check_circle' : 'radio_button_unchecked'}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                                    {members.map(m => (
                                        <div key={m.id} className="flex items-center gap-3">
                                            <span className={`text-sm font-medium flex-1 min-w-0 truncate ${(splitDetails[m.id] || 0) > 0 ? 'text-[#F4F4F8]' : 'text-[rgba(244,244,248,0.4)]'}`}>
                                                {m.name}
                                            </span>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-xs font-bold text-[rgba(244,244,248,0.25)]">₹</span>
                                                <input
                                                    type="text"
                                                    inputMode="decimal"
                                                    placeholder="0"
                                                    className="w-20 bg-white/10 rounded-xl px-2.5 py-2 text-right font-bold focus:ring-2 focus:ring-[#b613ec]/40 outline-none text-[#F4F4F8] text-sm"
                                                    style={{ WebkitAppearance: 'none' }}
                                                    value={splitDetails[m.id] || ''}
                                                    onChange={e => {
                                                        const val = e.target.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
                                                        setSplitDetails(prev => ({ ...prev, [m.id]: parseFloat(val) || 0 }));
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className={`pt-2.5 border-t border-white/10 flex justify-between text-xs font-bold uppercase tracking-widest ${Math.abs(currentSplitSum - parseFloat(amount || '0')) < 0.1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        <span>Split: ₹{currentSplitSum.toFixed(0)}</span>
                                        <span>Bill: ₹{parseFloat(amount || '0').toFixed(0)}</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ── Submit ── */}
                        <div className="pt-1 pb-2">
                            <motion.button
                                type="submit"
                                disabled={saving}
                                whileTap={{ scale: 0.97 }}
                                className="w-full btn-primary py-4 rounded-full flex items-center justify-center gap-2 font-bold text-base disabled:opacity-60 touch-manipulation"
                            >
                                <span>{saving ? 'Saving...' : initialData ? 'Update Expense' : 'Log Expense'}</span>
                                <span className="material-symbols-outlined text-lg">receipt_long</span>
                            </motion.button>
                        </div>
                    </form>
                </div>
            </motion.div>
        </div>
    );
};

export default ExpenseForm;

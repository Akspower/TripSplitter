import React, { useState } from 'react';
import { PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import type { Member, Expense, ExpenseCategory } from '../types';
import toast from 'react-hot-toast';

const ExpenseForm: React.FC<{ members: Member[], onAdd: (e: Expense) => void, onCancel: () => void, initialData?: Expense }> = ({ members, onAdd, onCancel, initialData }) => {
    const [desc, setDesc] = useState(initialData?.description || '');
    const [amount, setAmount] = useState(initialData?.amount.toString() || '');
    const [category, setCategory] = useState<ExpenseCategory>(initialData?.category || 'Food');
    const [payerId, setPayerId] = useState(initialData?.payerId || '');
    const [participantIds, setParticipantIds] = useState<string[]>(initialData?.participantIds || members.map(m => m.id));
    const [saving, setSaving] = useState(false);

    const [splitType, setSplitType] = useState<'EQUAL' | 'EXACT'>(initialData?.splitType || 'EQUAL');
    const [splitDetails, setSplitDetails] = useState<Record<string, number>>(initialData?.splitDetails || {});

    const currentSplitSum = Object.values(splitDetails).reduce((a, b) => a + b, 0);

    const toggleParticipant = (id: string) => {
        setParticipantIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    };

    const toggleAll = () => {
        if (participantIds.length === members.length) {
            setParticipantIds([]);
        } else {
            setParticipantIds(members.map(m => m.id));
        }
    };

    const handleSplitChange = (id: string, value: string) => {
        const val = parseFloat(value) || 0;
        setSplitDetails(prev => ({ ...prev, [id]: val }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Comprehensive Validation with Clear Error Messages

        // 1. Description validation
        if (!desc.trim()) {
            toast.error('Please enter a description for this expense');
            return;
        }

        if (desc.trim().length > 100) {
            toast.error('Description is too long (max 100 characters)');
            return;
        }

        // 2. Amount validation
        const numAmount = parseFloat(amount);
        if (!amount || isNaN(numAmount)) {
            toast.error('Please enter a valid amount');
            return;
        }

        if (numAmount <= 0) {
            toast.error('Amount must be greater than zero');
            return;
        }

        if (numAmount > 1000000) {
            toast.error('Amount seems too high. Please check.');
            return;
        }

        // 3. Payer validation (WHO PAID?)
        if (!payerId) {
            toast.error("Who paid for this? Please select who footed the bill", {
                icon: '💸',
                duration: 4000
            });
            return;
        }

        // 4. EXACT split validation
        if (splitType === 'EXACT') {
            if (Math.abs(currentSplitSum - numAmount) > 0.5) {
                toast.error(`Split amount (₹${currentSplitSum.toFixed(2)}) does not match bill amount (₹${numAmount.toFixed(2)}). Please fix.`);
                return;
            }
            // Filter participants to only those with > 0 amount
            const involvedIds = Object.keys(splitDetails).filter(id => splitDetails[id] > 0);
            if (involvedIds.length === 0) {
                toast.error("Please split the amount among members.");
                return;
            }

            setSaving(true);
            onAdd({
                id: initialData?.id || '',
                description: desc.trim(),
                amount: numAmount,
                date: initialData?.date || new Date().toISOString(),
                category,
                payerId,
                participantIds: involvedIds,
                createdBy: initialData?.createdBy || '',
                splitType: 'EXACT',
                splitDetails
            });
            return;
        }

        // 5. Participant validation (WHO OWES?)
        if (participantIds.length === 0) {
            toast.error('Please select at least one person who owes for this expense', {
                icon: '👥',
                duration: 4000
            });
            return;
        }

        // All validations passed - Submit
        setSaving(true);
        onAdd({
            id: initialData?.id || '',
            description: desc.trim(),
            amount: numAmount,
            date: initialData?.date || new Date().toISOString(),
            category,
            payerId,
            participantIds,
            createdBy: initialData?.createdBy || '',
            splitType: 'EQUAL'
        });
    };

    const categories: ExpenseCategory[] = ['Food', 'Drink', 'Alcohol', 'Cab/Taxi', 'Train/Bus/Flight', 'Hotel/Stay', 'Entry Fee', 'Trekking Gear', 'Shopping', 'Other'];

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-500">
            <div className="bg-white w-full max-w-xl rounded-t-[40px] sm:rounded-[48px] shadow-2xl overflow-y-auto max-h-[90vh] sm:max-h-none animate-in slide-in-from-bottom-20 duration-700">
                <form onSubmit={handleSubmit} className="p-8 sm:p-10 space-y-8 pb-32 sm:pb-10">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-3xl font-black text-slate-900 tracking-tight">Expense Details</h3>
                        <button type="button" onClick={onCancel} className="bg-slate-100 p-3 rounded-full text-slate-400 hover:text-slate-900 transition-colors">
                            <PlusIcon className="w-7 h-7 rotate-45" />
                        </button>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-transparent focus-within:border-indigo-500 transition-all">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Description</label>
                            <input autoFocus type="text" required maxLength={100} className="w-full bg-transparent border-none p-0 focus:ring-0 font-black text-2xl text-slate-900 placeholder:text-slate-200" placeholder="Ex: Dinner at Thalassa" value={desc} onChange={(e) => setDesc(e.target.value)} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-transparent focus-within:border-indigo-500 transition-all">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Amount (₹)</label>
                                <input type="number" required step="0.01" className="w-full bg-transparent border-none p-0 focus:ring-0 font-black text-3xl text-slate-900" placeholder="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
                            </div>
                            <div className="bg-slate-50 p-6 rounded-[32px] border-2 border-transparent focus-within:border-indigo-500 transition-all">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Type</label>
                                <select className="w-full bg-transparent border-none p-0 focus:ring-0 font-black text-lg text-slate-900 appearance-none" value={category} onChange={(e) => setCategory(e.target.value as ExpenseCategory)}>
                                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-3">Who Footed the Bill? <span className="text-rose-500">*</span></label>
                            <div className="flex gap-2 overflow-x-auto py-2 no-scrollbar">
                                {members.map(m => (
                                    <button
                                        key={m.id}
                                        type="button"
                                        onClick={() => setPayerId(m.id)}
                                        className={`shrink-0 px-5 py-3 rounded-2xl text-sm font-black transition-all border-2 ${payerId === m.id ? 'bg-slate-900 border-slate-900 text-white shadow-xl scale-105' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                                    >
                                        {m.name}
                                        {payerId === m.id && <span className="ml-2">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest">Split Details</label>
                                <div className="flex bg-slate-100 p-1 rounded-xl">
                                    <button type="button" onClick={() => setSplitType('EQUAL')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${splitType === 'EQUAL' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Equally</button>
                                    <button type="button" onClick={() => setSplitType('EXACT')} className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${splitType === 'EXACT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}>Exact Amounts</button>
                                </div>
                            </div>

                            {splitType === 'EQUAL' ? (
                                <>
                                    <div className="flex justify-end mb-2">
                                        <button type="button" onClick={toggleAll} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">
                                            {participantIds.length === members.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-3">
                                        {members.map(m => (
                                            <button key={m.id} type="button" onClick={() => toggleParticipant(m.id)} className={`px-5 py-3 rounded-2xl text-sm font-black transition-all flex items-center gap-3 ${participantIds.includes(m.id) ? 'bg-slate-900 text-white shadow-xl scale-105' : 'bg-slate-50 text-slate-200 line-through'}`}>
                                                {participantIds.includes(m.id) && <ChevronRightIcon className="w-4 h-4 text-indigo-400" />}
                                                {m.name}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-3 bg-slate-50 p-4 rounded-[24px]">
                                    {members.map(m => (
                                        <div key={m.id} className="flex items-center justify-between">
                                            <span className={`font-bold ${splitDetails[m.id] > 0 ? 'text-slate-900' : 'text-slate-400'}`}>{m.name}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-slate-300">₹</span>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className={`w-24 bg-white rounded-xl px-3 py-2 text-right font-black focus:ring-2 focus:ring-indigo-500 outline-none ${splitDetails[m.id] > 0 ? 'text-indigo-600' : 'text-slate-300'}`}
                                                    value={splitDetails[m.id] || ''}
                                                    onChange={(e) => handleSplitChange(m.id, e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                    <div className={`mt-4 pt-3 border-t border-slate-200 flex justify-between items-center text-xs font-black uppercase tracking-widest ${Math.abs(currentSplitSum - parseFloat(amount || '0')) < 0.1 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        <span>Total Split: ₹{currentSplitSum.toFixed(2)}</span>
                                        <span>Bill: ₹{parseFloat(amount || '0').toFixed(2)}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-8 flex gap-4">
                        <button type="button" onClick={onCancel} className="flex-1 py-6 rounded-[28px] font-black text-slate-400 hover:bg-slate-50 transition-colors uppercase tracking-widest text-xs">Discard</button>
                        <button type="submit" disabled={saving} className="flex-[2] bg-indigo-600 text-white py-6 rounded-[28px] font-black text-xl shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70">
                            {saving ? 'Saving...' : initialData ? 'Update Bill' : 'Save Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ExpenseForm;

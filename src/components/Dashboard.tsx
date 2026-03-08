import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { calculateDebts } from '../utils/debtCalculator';
import { getTripInsights } from '../services/groqService';
import { formatINR } from '../utils/formatters';
import type { Trip, Expense } from '../types';
import Analytics from './Analytics';
import { TripService } from '../services/tripService';
import toast from 'react-hot-toast';
import ConfirmDialog from './ui/ConfirmDialog';
import { vibrate, HapticPatterns } from '../utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import QuoteBar from './QuoteBar';
import { QRCodeSVG } from 'qrcode.react';

const TABS = [
    { id: 'expenses', label: 'Expenses', icon: 'receipt_long' },
    { id: 'summary', label: 'Settlement', icon: 'group' },
    { id: 'activity', label: 'Activity', icon: 'notifications' },
    { id: 'analytics', label: 'Analytics', icon: 'bar_chart' },
    { id: 'insights', label: 'AI Guide', icon: 'magic_button' },
] as const;

type TabId = typeof TABS[number]['id'];

// Simple count-up hook — animates from previous value to target, no library needed
function useCountUp(target: number, deps: unknown[] = []): number {
    const [val, setVal] = useState(target);
    const prevRef = useRef(target);
    useEffect(() => {
        const from = prevRef.current;
        prevRef.current = target;
        if (from === target) return;
        let start = from;
        const duration = 400;
        const step = 16;
        const increment = (target - from) / (duration / step);
        const timer = setInterval(() => {
            start += increment;
            if ((increment > 0 && start >= target) || (increment < 0 && start <= target)) {
                setVal(target); clearInterval(timer);
            } else setVal(Math.round(start));
        }, step);
        return () => clearInterval(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [target, ...deps]);
    return val;
}

const CATEGORY_EMOJI: Record<string, string> = {
    Food: '🍛', Drink: '🥤', Alcohol: '🍺', 'Cab/Taxi': '🚕',
    'Train/Bus/Flight': '✈️', 'Hotel/Stay': '🏨', 'Trekking Gear': '🥾',
    'Entry Fee': '🎟️', Shopping: '🛍️', Other: '📍',
};

const MEMBER_GRADIENTS = [
    'from-violet-500 to-[#b613ec]', 'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600', 'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-600', 'from-cyan-400 to-blue-500',
];

import { getAvatarEmoji } from './MemberAvatar';

const InitialAvatar: React.FC<{ name: string; size?: string; index?: number }> = ({ name, size = 'w-10 h-10', index = 0 }) => (
    <div className={`${size} rounded-2xl bg-gradient-to-br ${MEMBER_GRADIENTS[index % MEMBER_GRADIENTS.length]} flex items-center justify-center shrink-0 shadow-md select-none overflow-hidden relative`} title={name}>
        <div className="absolute inset-0 bg-white/10" />
        <span className="relative z-10 text-base leading-none">{getAvatarEmoji(index)}</span>
    </div>
);

const Dashboard: React.FC<{
    trip: Trip;
    myId: string;
    onAddExpense: () => void;
    onEditExpense: (e: Expense) => void;
    onDeleteExpense: (id: string) => void;
    onRefreshTrip: () => void;
    onExportPDF?: () => void;
}> = ({ trip, myId, onAddExpense, onEditExpense, onDeleteExpense, onRefreshTrip, onExportPDF }) => {

    const [activeTab, setActiveTab] = useState<TabId>('expenses');
    const [insights, setInsights] = useState<string | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [showManageTeam, setShowManageTeam] = useState(false);
    const [showQRExpanded, setShowQRExpanded] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(new Set());
    const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDestructive: false
    });

    const prevExpenseCount = useRef(trip.expenses.length);

    const optimisticTrip = useMemo(() => {
        if (hiddenMemberIds.size === 0) return trip;
        return { ...trip, members: trip.members.filter(m => !hiddenMemberIds.has(m.id)) };
    }, [trip, hiddenMemberIds]);

    useEffect(() => {
        setHiddenMemberIds(prev => {
            const next = new Set(prev);
            const currentIds = new Set(trip.members.map(m => m.id));
            for (const id of next) { if (!currentIds.has(id)) next.delete(id); }
            return next;
        });
    }, [trip.members]);

    const tripTotal = useMemo(() => optimisticTrip.expenses.reduce((s, e) => s + e.amount, 0), [optimisticTrip]);
    const myConsumption = useMemo(() => optimisticTrip.expenses.reduce((s, e) => {
        if (e.splitType === 'EXACT' && e.splitDetails) return s + (e.splitDetails[myId] || 0);
        if (e.participantIds.includes(myId)) return s + e.amount / e.participantIds.length;
        return s;
    }, 0), [optimisticTrip, myId]);
    const myPayments = useMemo(() => optimisticTrip.expenses.reduce((s, e) => e.payerId === myId ? s + e.amount : s, 0), [optimisticTrip, myId]);
    const myBalance = myPayments - myConsumption;
    const debts = useMemo(() => calculateDebts(optimisticTrip), [optimisticTrip]);

    // Activity feed: last 20 expenses reversed, most recent first
    const activityItems = useMemo(() => [...trip.expenses].reverse().slice(0, 20), [trip.expenses]);

    const fetchInsights = useCallback(async (force = false) => {
        if (insights && !force) return;
        setLoadingInsights(true);
        try {
            const data = await getTripInsights(optimisticTrip);
            setInsights(data || 'No insights found.');
        } catch { setInsights('Could not fetch insights at this time.'); }
        finally { setLoadingInsights(false); }
    }, [optimisticTrip, insights]);

    useEffect(() => { if (activeTab === 'insights' && !insights) fetchInsights(); }, [activeTab]);
    useEffect(() => {
        if (trip.expenses.length !== prevExpenseCount.current && insights) {
            prevExpenseCount.current = trip.expenses.length;
            const t = setTimeout(() => fetchInsights(true), 1000);
            return () => clearTimeout(t);
        }
    }, [trip.expenses.length]);

    const handleRemoveMember = async (memberId: string) => {
        setConfirmModal({
            isOpen: true, title: 'Remove Member?',
            message: 'This will delete their payments and remove them from all splits.',
            isDestructive: true,
            onConfirm: async () => {
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const toastId = toast.loading('Removing member...');
                setHiddenMemberIds(prev => new Set(prev).add(memberId));
                const success = await TripService.removeMember(trip.id, memberId);
                if (success) { toast.success('Member removed!', { id: toastId }); onRefreshTrip(); }
                else {
                    toast.error('Could not remove member.', { id: toastId });
                    setHiddenMemberIds(prev => { const n = new Set(prev); n.delete(memberId); return n; });
                }
            }
        });
    };

    const filteredExpenses = useMemo(() =>
        optimisticTrip.expenses.filter(e =>
            !searchTerm ||
            e.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.amount.toString().includes(searchTerm) ||
            e.category.toLowerCase().includes(searchTerm.toLowerCase())
        ).slice().reverse()
        , [optimisticTrip.expenses, searchTerm]);

    const myName = trip.members.find(m => m.id === myId)?.name?.split(' ')[0] || 'Me';

    // Settlement derived state
    const iOwe = useMemo(() => debts.filter(d => d.from === myId), [debts, myId]);
    const theyOweMe = useMemo(() => debts.filter(d => d.to === myId), [debts, myId]);
    const totalMyOwed = useMemo(() => iOwe.reduce((s, d) => s + d.amount, 0), [iOwe]);
    const totalTheyOweMe = useMemo(() => theyOweMe.reduce((s, d) => s + d.amount, 0), [theyOweMe]);


    // Count-up animation for balance number
    const animatedBalance = useCountUp(Math.abs(myBalance), [myBalance]);

    return (
        <div className="pb-[calc(11rem+env(safe-area-inset-bottom,0px))] px-4 md:px-6 pt-6 max-w-7xl mx-auto w-full">
            <ConfirmDialog isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message}
                isDestructive={confirmModal.isDestructive} onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
            <ConfirmDialog isOpen={expenseToDelete !== null} title="Delete Expense?"
                message="Are you sure? This will affect settlement calculations."
                isDestructive={true}
                onConfirm={() => { if (expenseToDelete) { onDeleteExpense(expenseToDelete); setExpenseToDelete(null); } }}
                onCancel={() => setExpenseToDelete(null)} />

            <div className="lg:grid lg:grid-cols-12 lg:gap-8 lg:items-start">

                {/* ── Left: Balance Card ──────────────────── */}
                <div className="lg:col-span-5 space-y-4 mb-8 lg:mb-0 lg:sticky lg:top-24">
                    <div className="glass-card rounded-2xl p-6 relative overflow-hidden card-3d ios-shadow">
                        <div className="absolute -top-12 -right-12 w-40 h-40 bg-[#b613ec]/20 rounded-full blur-3xl pointer-events-none" />

                        <div className="flex justify-between items-start mb-4 relative z-10">
                            <div>
                                <p className="text-[rgba(244,244,248,0.45)] text-sm font-medium mb-1">My Net Standing</p>
                                <h2 className={`text-4xl font-bold tracking-tight tabular-nums ${myBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {myBalance >= 0 ? '+' : '-'}{formatINR(animatedBalance)}
                                </h2>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full ${myBalance >= 0 ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                                    <span className="text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest">
                                        {myBalance >= 0 ? 'Squad owes you' : 'You owe the squad'}
                                    </span>
                                    <span className="ml-2 px-2.5 py-1 glass-card-primary text-[#b613ec] text-[10px] font-bold rounded-full border border-[#b613ec]/30">
                                        {formatINR(tripTotal)} total
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 relative z-10">
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-[rgba(244,244,248,0.4)] text-[10px] uppercase font-bold tracking-widest">Personal</p>
                                    <p className="text-[#F4F4F8] text-xs font-bold">{formatINR(myConsumption)}</p>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#b613ec] rounded-full" style={{ width: `${Math.min(100, tripTotal ? (myConsumption / tripTotal) * 100 : 0)}%` }} />
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                <div className="flex justify-between items-end mb-2">
                                    <p className="text-[rgba(244,244,248,0.4)] text-[10px] uppercase font-bold tracking-widest">You Paid</p>
                                    <p className="text-[#F4F4F8] text-xs font-bold">{formatINR(myPayments)}</p>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#b613ec] rounded-full" style={{ width: `${Math.min(100, tripTotal ? (myPayments / tripTotal) * 100 : 0)}%` }} />
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between relative z-10">
                            <div className="flex -space-x-2">
                                {trip.members.slice(0, 4).map((m, i) => (
                                    <div key={m.id} title={m.name}
                                        className={`w-8 h-8 rounded-xl border-2 border-[#0A0A0F] flex items-center justify-center font-bold text-xs text-white bg-gradient-to-br ${MEMBER_GRADIENTS[i % MEMBER_GRADIENTS.length]}`}>
                                        {m.name.charAt(0)}
                                    </div>
                                ))}
                                {trip.members.length > 4 && (
                                    <div className="w-8 h-8 rounded-xl border-2 border-[#0A0A0F] glass-pill flex items-center justify-center text-[10px] font-bold text-[rgba(244,244,248,0.5)]">
                                        +{trip.members.length - 4}
                                    </div>
                                )}
                            </div>
                            <span className="text-[10px] text-[rgba(244,244,248,0.3)] font-bold uppercase tracking-widest">
                                {trip.members.length} members
                            </span>
                        </div>
                        {/* Expiry pill */}
                        {trip.createdAt && (() => {
                            const daysLeft = Math.max(0, 45 - Math.floor((Date.now() - new Date(trip.createdAt).getTime()) / (1000 * 60 * 60 * 24)));
                            return (
                                <div className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase tracking-widest ${daysLeft <= 7 ? 'bg-rose-400/10 border-rose-400/20 text-rose-400' : 'bg-white/5 border-white/5 text-[rgba(244,244,248,0.35)]'}`}>
                                    <span className="material-symbols-outlined text-xs">schedule</span>
                                    <span>Expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}</span>
                                </div>
                            );
                        })()}
                    </div>
                </div>

                {/* ── Right: Tabs + Content ──────────────── */}
                <div className="lg:col-span-7 w-full">
                    {/* ── Trip Progress Strip ──────────────────────── */}
                    {(() => {
                        const now = new Date();
                        const start = new Date(trip.startDate);
                        const end = new Date(trip.endDate);
                        const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
                        const elapsed = Math.max(0, Math.min(totalDays, Math.ceil((now.getTime() - start.getTime()) / 86400000)));
                        const pct = Math.round((elapsed / totalDays) * 100);
                        const daysLeft = Math.max(0, totalDays - elapsed);
                        const tripEnded = now > end;
                        return (
                            <div className="glass-card rounded-2xl px-4 py-3 border border-white/8 mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-[rgba(244,244,248,0.35)]">
                                        {tripEnded ? 'Trip Ended' : daysLeft === 0 ? 'Last Day!' : `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`}
                                    </span>
                                    <span className="text-[10px] font-bold text-[rgba(244,244,248,0.35)]">
                                        Day {Math.min(elapsed + 1, totalDays)} of {totalDays}
                                    </span>
                                </div>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${tripEnded ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#b613ec] to-indigo-500'}`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                                <div className="flex justify-between mt-1.5">
                                    <span className="text-[9px] text-[rgba(244,244,248,0.2)]">{start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                    <span className="text-[9px] text-[rgba(244,244,248,0.2)]">{end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* ── Tab Buttons ─────────────────────────────── */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar py-2 mb-6">
                        {TABS.map(tab => (
                            <motion.button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 relative ${activeTab === tab.id
                                    ? 'bg-[#b613ec] text-white shadow-lg shadow-[#b613ec]/30'
                                    : 'glass-card text-[rgba(244,244,248,0.45)] hover:text-[#F4F4F8]'
                                    }`}
                                whileTap={{ scale: 0.95 }}
                            >
                                <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                                {tab.label}
                                {/* Settlement badge — shows when user has pending debts */}
                                {tab.id === 'summary' && iOwe.length > 0 && activeTab !== 'summary' && (
                                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#0A0A0F]" />
                                )}
                            </motion.button>
                        ))}
                    </div>

                    <AnimatePresence mode="popLayout" initial={false}>
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.15 }}
                        >
                            {/* ── EXPENSES TAB ── */}
                            {activeTab === 'expenses' && (
                                <div className="space-y-3">
                                    {optimisticTrip.expenses.length > 0 && (
                                        <div className="relative mb-4">
                                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[rgba(244,244,248,0.3)] text-lg">search</span>
                                            <input type="text" placeholder="Search expenses..."
                                                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                                                className="w-full glass-card pl-11 pr-4 py-3.5 rounded-2xl text-[#F4F4F8] placeholder:text-[rgba(244,244,248,0.25)] font-medium focus:outline-none focus:ring-2 focus:ring-[#b613ec]/30 text-sm border border-white/8" />
                                        </div>
                                    )}
                                    {filteredExpenses.length === 0 ? (
                                        <div className="glass-card rounded-3xl border-2 border-dashed border-white/10 overflow-hidden">
                                            <div className="p-10 flex flex-col items-center text-center">
                                                {/* Floating emoji illustration */}
                                                <div className="text-6xl mb-4 animate-float-emoji select-none">🌴</div>
                                                <p className="text-[#F4F4F8] font-bold text-lg mb-1">
                                                    {optimisticTrip.expenses.length === 0 ? 'No bills logged yet!' : 'No results found'}
                                                </p>
                                                <p className="text-[rgba(244,244,248,0.35)] text-sm mb-6">
                                                    {optimisticTrip.expenses.length === 0
                                                        ? "The trip is live but the wallet hasn't been touched yet."
                                                        : 'Try a different search term.'}
                                                </p>
                                                {optimisticTrip.expenses.length === 0 && (
                                                    <>
                                                        <button
                                                            onClick={onAddExpense}
                                                            className="btn-primary px-6 py-3 rounded-full font-bold text-sm flex items-center gap-2 mb-5"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">add_circle</span>
                                                            Log First Bill
                                                        </button>
                                                        <QuoteBar category="travel" compact interval={12000} className="w-full" />
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        filteredExpenses.map((e) => {
                                            const payerIdx = trip.members.findIndex(m => m.id === e.payerId);
                                            return (
                                                <motion.div key={e.id}
                                                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.1 }}
                                                    className={`glass-card rounded-2xl p-4 flex items-start gap-3 transition-all duration-200 active:scale-[0.98] group ${!e.participantIds.includes(myId) ? 'opacity-40' : ''}`}>
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center text-2xl border border-white/5 shrink-0 group-hover:bg-[#b613ec]/10 transition-colors">
                                                        {CATEGORY_EMOJI[e.category] || '🧾'}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start gap-2 mb-0.5">
                                                            <h4 className="font-bold text-[#F4F4F8] text-sm leading-snug line-clamp-2 flex-1">{e.description}</h4>
                                                            {(e.createdBy === myId || e.payerId === myId) && (
                                                                <button onClick={() => { vibrate(HapticPatterns.soft); onEditExpense(e); }}
                                                                    className="shrink-0 sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity p-1 rounded-full text-[rgba(244,244,248,0.3)] hover:text-[#b613ec]">
                                                                    <span className="material-symbols-outlined text-sm">edit</span>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-wrap mt-1">
                                                            <span className="text-[10px] text-[rgba(244,244,248,0.35)]">
                                                                {new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-widest ${e.payerId === myId
                                                                ? 'bg-[#b613ec]/15 text-[#b613ec] border-[#b613ec]/30'
                                                                : 'bg-white/5 text-[rgba(244,244,248,0.4)] border-white/10'
                                                                }`}>
                                                                {e.payerId === myId ? 'You Paid' : `${optimisticTrip.members.find(m => m.id === e.payerId)?.name || 'Unknown'} Paid`}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                        <div className="text-right">
                                                            <span className="block font-bold text-[#F4F4F8] text-base">{formatINR(e.amount)}</span>
                                                            {e.participantIds.includes(myId) && (
                                                                <span className="text-[10px] text-[#b613ec] font-bold block">
                                                                    {e.splitType === 'EXACT' && e.splitDetails
                                                                        ? `You: ${formatINR(e.splitDetails[myId] || 0)}`
                                                                        : `${formatINR(e.amount / e.participantIds.length)}/ea`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {(e.createdBy === myId || trip.creatorId === myId) && (
                                                            <button onClick={() => { vibrate(HapticPatterns.warning); setExpenseToDelete(e.id); }}
                                                                className="sm:opacity-0 sm:group-hover:opacity-100 opacity-100 transition-opacity p-2.5 glass-pill rounded-xl text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/10">
                                                                <span className="material-symbols-outlined text-base">delete</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                    {/* Avatar indicator */}
                                                    <InitialAvatar name={optimisticTrip.members.find(m => m.id === e.payerId)?.name || '?'} size="w-8 h-8" index={payerIdx >= 0 ? payerIdx : 0} />
                                                </motion.div>
                                            );
                                        })
                                    )}
                                </div>
                            )}

                            {/* ── SETTLEMENT TAB ── */}
                            {activeTab === 'summary' && (
                                <div className="space-y-4">
                                    {/* ── Personal Summary Strip ── */}
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className={`glass-card rounded-2xl p-4 border relative overflow-hidden ${iOwe.length > 0 ? 'border-rose-400/30' : 'border-white/8'}`}>
                                            {iOwe.length > 0 && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-rose-500/0 via-rose-500 to-rose-500/0" />}
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[rgba(244,244,248,0.35)] mb-1">You Owe</p>
                                            <p className={`text-2xl font-bold ${iOwe.length > 0 ? 'text-rose-400' : 'text-[rgba(244,244,248,0.2)]'}`}>
                                                {iOwe.length > 0 ? formatINR(totalMyOwed) : '—'}
                                            </p>
                                            <p className="text-[10px] text-[rgba(244,244,248,0.3)] mt-0.5">{iOwe.length > 0 ? `to ${iOwe.length} person${iOwe.length > 1 ? 's' : ''}` : 'Nothing to pay'}</p>
                                        </div>
                                        <div className={`glass-card rounded-2xl p-4 border relative overflow-hidden ${theyOweMe.length > 0 ? 'border-emerald-400/30' : 'border-white/8'}`}>
                                            {theyOweMe.length > 0 && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />}
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-[rgba(244,244,248,0.35)] mb-1">Owed to You</p>
                                            <p className={`text-2xl font-bold ${theyOweMe.length > 0 ? 'text-emerald-400' : 'text-[rgba(244,244,248,0.2)]'}`}>
                                                {theyOweMe.length > 0 ? formatINR(totalTheyOweMe) : '—'}
                                            </p>
                                            <p className="text-[10px] text-[rgba(244,244,248,0.3)] mt-0.5">{theyOweMe.length > 0 ? `from ${theyOweMe.length} person${theyOweMe.length > 1 ? 's' : ''}` : 'No dues pending'}</p>
                                        </div>
                                    </div>

                                    {/* ── Header with manage team ── */}
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-[rgba(244,244,248,0.4)] font-medium">
                                                {debts.length === 0 ? 'All accounts settled ✓' : `${debts.length} transfer${debts.length > 1 ? 's' : ''} needed`}
                                            </p>
                                        </div>
                                        <button onClick={() => setShowManageTeam(true)}
                                            className="text-xs font-bold text-[#b613ec] uppercase tracking-widest glass-card-primary px-3 py-1.5 rounded-full border border-[#b613ec]/30 flex items-center gap-1.5 hover:bg-[#b613ec]/10 transition-colors">
                                            <span className="material-symbols-outlined text-sm">settings</span>
                                            Team
                                        </button>
                                    </div>

                                    {/* ── Debt cards ── */}
                                    <div className="space-y-3">
                                        {debts.length === 0 ? (
                                            <div className="text-center py-12 glass-card rounded-3xl border border-emerald-500/15 overflow-hidden">
                                                <div className="text-5xl mb-4 animate-float-emoji select-none">🎉</div>
                                                <p className="text-[rgba(244,244,248,0.7)] font-bold text-lg mb-1">Perfectly Balanced!</p>
                                                <p className="text-[rgba(244,244,248,0.3)] text-sm mb-5">No payments needed — everyone's square.</p>
                                                <QuoteBar category="settled" compact interval={10000} className="mx-4" />
                                            </div>
                                        ) : (
                                            debts.map((d, idx) => {
                                                const fromMember = trip.members.find(m => m.id === d.from);
                                                const toMember = trip.members.find(m => m.id === d.to);
                                                const fromIdx = trip.members.findIndex(m => m.id === d.from);
                                                const toIdx = trip.members.findIndex(m => m.id === d.to);
                                                const isFromMe = d.from === myId;
                                                const isToMe = d.to === myId;

                                                return (
                                                    <motion.div key={idx}
                                                        initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.1 }}
                                                        className={`rounded-2xl border relative overflow-hidden card-3d ${isFromMe ? 'glass-card-primary border-rose-400/30' : isToMe ? 'glass-card-primary border-emerald-400/30' : 'glass-card border-white/5 opacity-60'}`}>
                                                        {/* Top accent line */}
                                                        {isFromMe && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-rose-500/0 via-rose-500 to-rose-500/0" />}
                                                        {isToMe && <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-emerald-500/0 via-emerald-500 to-emerald-500/0" />}

                                                        <div className="p-4">
                                                            {/* Involvement label */}
                                                            {isFromMe && (
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-3 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">arrow_upward</span>
                                                                    YOU OWE
                                                                </p>
                                                            )}
                                                            {isToMe && (
                                                                <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-1">
                                                                    <span className="material-symbols-outlined text-sm">arrow_downward</span>
                                                                    YOU RECEIVE
                                                                </p>
                                                            )}

                                                            {/* Transaction flow row */}
                                                            <div className="flex items-center gap-3">
                                                                {/* From */}
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <InitialAvatar name={fromMember?.name || '?'} size="w-11 h-11" index={fromIdx} />
                                                                    <div className="min-w-0">
                                                                        <p className="font-bold text-[#F4F4F8] text-sm leading-tight break-words">{isFromMe ? 'You' : fromMember?.name || '?'}</p>
                                                                        <p className="text-[10px] text-[rgba(244,244,248,0.35)]">pays</p>
                                                                    </div>
                                                                </div>

                                                                {/* Amount center */}
                                                                <div className="flex flex-col items-center shrink-0">
                                                                    <div className={`px-3 py-1.5 rounded-xl font-bold text-sm ${isFromMe ? 'bg-rose-500/15 text-rose-300' : isToMe ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/5 text-[rgba(244,244,248,0.7)]'}`}>
                                                                        {formatINR(d.amount)}
                                                                    </div>
                                                                    <div className="flex items-center gap-1 mt-1">
                                                                        <div className="w-8 h-[1px] bg-white/10" />
                                                                        <span className="material-symbols-outlined text-xs text-[rgba(244,244,248,0.2)]">arrow_forward</span>
                                                                        <div className="w-8 h-[1px] bg-white/10" />
                                                                    </div>
                                                                </div>

                                                                {/* To */}
                                                                <div className="flex items-center gap-2 flex-1 min-w-0 flex-row-reverse">
                                                                    <InitialAvatar name={toMember?.name || '?'} size="w-11 h-11" index={toIdx} />
                                                                    <div className="min-w-0 text-right">
                                                                        <p className="font-bold text-[#F4F4F8] text-sm leading-tight break-words">{isToMe ? 'You' : toMember?.name || '?'}</p>
                                                                        <p className="text-[10px] text-[rgba(244,244,248,0.35)]">receives</p>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* ── ACTIVITY TAB ── */}
                            {activeTab === 'activity' && (
                                <div>
                                    {activityItems.length === 0 ? (
                                        <div className="text-center py-20 glass-card rounded-3xl border-2 border-dashed border-white/10">
                                            <div className="glass-pill w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <span className="material-symbols-outlined text-[rgba(244,244,248,0.25)] text-3xl">notifications_none</span>
                                            </div>
                                            <p className="text-[rgba(244,244,248,0.4)] font-bold">No expenses logged yet.</p>
                                            <button onClick={onAddExpense} className="text-[#b613ec] font-bold mt-3 text-sm uppercase tracking-widest hover:opacity-70 transition-opacity">
                                                Add First Bill
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {activityItems.map((e) => {
                                                // Use the FULL unfiltered member list for lookups
                                                const allMembers = trip.members;
                                                const payer = allMembers.find(m => m.id === e.payerId);
                                                const loggedBy = allMembers.find(m => m.id === e.createdBy);
                                                const payerIdx = allMembers.findIndex(m => m.id === e.payerId);
                                                const iAmPayer = e.payerId === myId;
                                                const iAmParticipant = e.participantIds.includes(myId);
                                                const payerNotInSplit = !e.participantIds.includes(e.payerId);
                                                const loggedByDiffFromPayer = e.createdBy && e.createdBy !== e.payerId;
                                                const isCustomSplit = e.splitType === 'EXACT' && e.splitDetails;

                                                // Timestamp — show full date if older than 24h
                                                const diffMs = Date.now() - new Date(e.date).getTime();
                                                const diffMin = Math.floor(diffMs / 60000);
                                                const diffHr = Math.floor(diffMs / 3600000);
                                                const diffDay = Math.floor(diffMs / 86400000);
                                                const timestamp = diffMin < 1 ? 'just now'
                                                    : diffMin < 60 ? `${diffMin}m ago`
                                                        : diffHr < 24 ? `${diffHr}h ago`
                                                            : diffDay < 7 ? `${diffDay}d ago`
                                                                : new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

                                                // My share amount
                                                const myShare = isCustomSplit
                                                    ? (e.splitDetails![myId] || 0)
                                                    : iAmParticipant ? e.amount / e.participantIds.length : 0;

                                                return (
                                                    <motion.div key={e.id}
                                                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                                                        transition={{ duration: 0.15 }}
                                                        className={`glass-card rounded-2xl border overflow-hidden ${iAmParticipant ? 'border-[#b613ec]/20' : 'border-white/5'}`}
                                                    >
                                                        {/* Colored top bar */}
                                                        {iAmParticipant && <div className="h-0.5 bg-gradient-to-r from-[#b613ec]/0 via-[#b613ec] to-[#b613ec]/0" />}

                                                        <div className="p-4 space-y-3">
                                                            {/* Row 1: category + title + amount + timestamp */}
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl border border-white/5 shrink-0">
                                                                    {CATEGORY_EMOJI[e.category] || '🧾'}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex items-start justify-between gap-2">
                                                                        <h4 className="font-bold text-[#F4F4F8] text-sm leading-tight truncate">{e.description}</h4>
                                                                        <span className="text-lg font-bold text-[#F4F4F8] shrink-0">{formatINR(e.amount)}</span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                                        <span className="text-[10px] text-[rgba(244,244,248,0.3)]">{timestamp}</span>
                                                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${isCustomSplit ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' : 'bg-white/5 text-[rgba(244,244,248,0.35)] border border-white/8'}`}>
                                                                            {isCustomSplit ? 'Custom Split' : 'Equal Split'}
                                                                        </span>
                                                                        {!iAmParticipant && (
                                                                            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide bg-white/5 text-[rgba(244,244,248,0.25)] border border-white/8">
                                                                                Not involved
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Row 2: Payer info */}
                                                            <div className="flex items-center gap-3">
                                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                                    <InitialAvatar name={payer?.name || '?'} size="w-7 h-7" index={payerIdx} />
                                                                    <p className="text-xs text-[rgba(244,244,248,0.5)] truncate">
                                                                        <span className="font-bold text-[#F4F4F8]">{iAmPayer ? 'You' : payer?.name || 'Unknown'}</span>
                                                                        {' '}<span className="text-[rgba(244,244,248,0.4)]">paid</span>
                                                                    </p>
                                                                </div>
                                                                {/* Logged by (if different from payer) */}
                                                                {loggedByDiffFromPayer && loggedBy && (
                                                                    <p className="text-[10px] text-[rgba(244,244,248,0.3)] flex items-center gap-1 shrink-0">
                                                                        <span className="material-symbols-outlined text-xs">edit</span>
                                                                        {e.createdBy === myId ? 'logged by you' : `logged by ${loggedBy.name}`}
                                                                    </p>
                                                                )}
                                                            </div>

                                                            {/* ⚠️ Payer not in split warning */}
                                                            {payerNotInSplit && (
                                                                <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
                                                                    <span className="material-symbols-outlined text-amber-400 text-sm">warning</span>
                                                                    <p className="text-[11px] text-amber-400/80 font-medium">
                                                                        {iAmPayer ? 'You paid but are not splitting this expense.' : `${payer?.name || 'Payer'} fronted this but isn't sharing the cost.`}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Row 3: Participants + your share */}
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                                    {e.participantIds.slice(0, 6).map((pid) => {
                                                                        const pm = allMembers.find(m => m.id === pid);
                                                                        const pi = allMembers.findIndex(m => m.id === pid);
                                                                        if (!pm) return null;
                                                                        return (
                                                                            <div key={pid}
                                                                                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${pid === myId ? 'bg-[#b613ec]/15 border-[#b613ec]/30 text-[#b613ec]' : 'bg-white/5 border-white/8 text-[rgba(244,244,248,0.4)]'}`}
                                                                                title={pm.name}>
                                                                                <span className={`w-3 h-3 rounded-full flex items-center justify-center text-[7px] text-white bg-gradient-to-br ${MEMBER_GRADIENTS[pi % MEMBER_GRADIENTS.length]}`}>
                                                                                    {pm.name.charAt(0)}
                                                                                </span>
                                                                                {pid === myId ? 'You' : pm.name.split(' ')[0]}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                    {e.participantIds.length > 6 && (
                                                                        <span className="text-[10px] text-[rgba(244,244,248,0.3)] font-bold">+{e.participantIds.length - 6}</span>
                                                                    )}
                                                                </div>
                                                                {/* Your share chip */}
                                                                {iAmParticipant && (
                                                                    <div className="shrink-0 bg-[#b613ec]/15 border border-[#b613ec]/25 rounded-xl px-3 py-1.5 text-right">
                                                                        <p className="text-[9px] font-bold uppercase tracking-wide text-[#b613ec]/70">Your share</p>
                                                                        <p className="text-sm font-bold text-[#b613ec]">{formatINR(myShare)}</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* ── ANALYTICS TAB ── */}
                            {activeTab === 'analytics' && (
                                <Analytics trip={optimisticTrip} myId={myId} onExportPDF={onExportPDF} />
                            )}

                            {/* ── AI GUIDE TAB ── */}
                            {activeTab === 'insights' && (
                                <div className="glass-card p-6 rounded-2xl relative overflow-hidden border border-white/8">
                                    <div className="absolute -right-10 -top-10 w-64 h-64 bg-[#b613ec]/10 rounded-full blur-3xl pointer-events-none" />
                                    <div className="flex items-center justify-between mb-6 relative z-10">
                                        <div>
                                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#b613ec]/80 block mb-1">Smart Analysis</span>
                                            <h3 className="text-xl font-bold text-[#F4F4F8] flex items-center gap-2">
                                                <span className="material-symbols-outlined text-[#b613ec]">magic_button</span>
                                                AI Trip Guide
                                            </h3>
                                        </div>
                                        <button onClick={() => { setInsights(null); fetchInsights(true); }}
                                            className="glass-pill p-3 rounded-2xl hover:bg-white/10 transition-all">
                                            <span className={`material-symbols-outlined text-xl text-[rgba(244,244,248,0.5)] ${loadingInsights ? 'animate-spin' : ''}`}>refresh</span>
                                        </button>
                                    </div>

                                    {/* AI Insight Pill */}
                                    {!loadingInsights && insights && (
                                        <div className="bg-[#b613ec]/10 border border-[#b613ec]/20 rounded-full py-2.5 px-5 flex items-center gap-3 mb-5">
                                            <span className="text-xl shrink-0">💡</span>
                                            <p className="text-xs font-medium text-[rgba(244,244,248,0.7)]">AI-powered insights for your trip</p>
                                        </div>
                                    )}

                                    {loadingInsights ? (
                                        <div className="space-y-4 relative z-10">
                                            <div className="h-6 w-2/3 animate-shimmer rounded-xl" />
                                            <div className="space-y-2">
                                                {[1, 2, 3].map(i => <div key={i} className="h-4 w-full animate-shimmer rounded-lg" style={{ opacity: 1 - i * 0.15 }} />)}
                                            </div>
                                            <p className="text-center text-[rgba(244,244,248,0.3)] text-sm font-bold animate-pulse pt-4">Crafting your trip strategy...</p>
                                        </div>
                                    ) : (
                                        <div className="prose prose-invert max-w-none text-[rgba(244,244,248,0.7)] leading-relaxed whitespace-pre-line text-sm font-medium relative z-10">
                                            {insights || 'Tap refresh and the AI will analyse your expenses and give you smart tips!'}
                                        </div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Floating Bottom Dock ───────────────────── */}
            <div className="fixed bottom-[calc(1.5rem+env(safe-area-inset-bottom,0px))] left-1/2 floating-dock w-[92%] max-w-lg z-40">
                <div className="glass-card px-4 py-2.5 rounded-full border border-white/10 shadow-2xl shadow-black/50 flex items-center justify-between ring-1 ring-white/5">
                    <div className="flex items-center gap-3 ml-1">
                        <div className="flex -space-x-2">
                            {trip.members.slice(0, 3).map((m, i) => (
                                <div key={m.id}
                                    className={`w-8 h-8 rounded-xl border-2 border-[#0A0A0F] flex items-center justify-center font-bold text-xs text-white bg-gradient-to-br ${MEMBER_GRADIENTS[i % MEMBER_GRADIENTS.length]}`}>
                                    {m.name.charAt(0)}
                                </div>
                            ))}
                            {trip.members.length > 3 && (
                                <div className="w-8 h-8 rounded-xl border-2 border-[#0A0A0F] glass-pill flex items-center justify-center text-[10px] font-bold text-[rgba(244,244,248,0.5)]">
                                    +{trip.members.length - 3}
                                </div>
                            )}
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-[9px] text-[rgba(244,244,248,0.35)] font-bold uppercase tracking-widest">Logged as</p>
                            <p className="text-sm font-bold text-[#b613ec]">{myName}</p>
                        </div>
                    </div>
                    <motion.button whileTap={{ scale: 0.92 }} onClick={onAddExpense}
                        className="btn-primary h-11 px-6 rounded-full flex items-center gap-2 text-sm font-bold">
                        <span className="material-symbols-outlined text-xl">add</span>
                        <span>Log Bill</span>
                    </motion.button>
                </div>
            </div>

            {/* ── Team Management Modal ───────────────── */}
            <AnimatePresence initial={false}>
                {showManageTeam && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }} transition={{ duration: 0.2, ease: "easeOut" }}
                            className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold text-[#F4F4F8]">Team Members</h3>
                                <button onClick={() => setShowManageTeam(false)}
                                    className="w-9 h-9 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.4)] hover:text-[#F4F4F8]">
                                    <span className="material-symbols-outlined text-lg">close</span>
                                </button>
                            </div>

                            <div className="mb-5 p-4 glass-card-primary rounded-2xl border border-[#b613ec]/20 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-[#b613ec] uppercase tracking-widest mb-0.5">Invite Friend</p>
                                    <p className="text-xs font-bold text-[rgba(244,244,248,0.6)] truncate">Room ID: {trip.id}</p>
                                </div>
                                <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?join=${trip.id}`); toast.success('Invite link copied!'); }}
                                    className="btn-primary px-4 py-2 rounded-xl text-xs font-bold shrink-0">
                                    Copy Link
                                </button>
                            </div>

                            {/* QR Code — small preview, tap to expand */}
                            <div className="mb-5 flex flex-col items-center gap-2">
                                <button onClick={() => setShowQRExpanded(true)} className="bg-white rounded-xl p-2 shadow-lg hover:shadow-xl transition-shadow active:scale-95">
                                    <QRCodeSVG
                                        value={`${window.location.origin}/?join=${trip.id}`}
                                        size={80}
                                        bgColor="#ffffff"
                                        fgColor="#0A0A0F"
                                        level="H"
                                        includeMargin={false}
                                    />
                                </button>
                                <p className="text-[10px] text-[rgba(244,244,248,0.35)] font-bold uppercase tracking-widest">Tap QR to enlarge</p>
                            </div>

                            {/* QR Expanded Overlay */}
                            <AnimatePresence initial={false}>
                                {showQRExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                        transition={{ duration: 0.15 }}
                                        className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center"
                                        onClick={() => setShowQRExpanded(false)}
                                    >
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}
                                            transition={{ duration: 0.15 }}
                                            className="bg-white rounded-3xl p-6 shadow-2xl"
                                            onClick={e => e.stopPropagation()}
                                        >
                                            <QRCodeSVG
                                                value={`${window.location.origin}/?join=${trip.id}`}
                                                size={200}
                                                bgColor="#ffffff"
                                                fgColor="#0A0A0F"
                                                level="H"
                                                includeMargin={false}
                                            />
                                            <p className="text-center text-xs text-gray-500 font-bold mt-3 uppercase tracking-widest">Scan to join</p>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
                                {optimisticTrip.members.map((m, i) => (
                                    <div key={m.id} className="flex items-center justify-between p-3.5 glass-card rounded-2xl border border-white/5">
                                        <div className="flex items-center gap-3">
                                            <InitialAvatar name={m.name} size="w-10 h-10" index={i} />
                                            <div>
                                                <p className="font-bold text-[#F4F4F8] text-sm">{m.name}</p>
                                                {m.isCreator && <p className="text-[10px] font-bold text-[#b613ec] uppercase tracking-widest">Admin</p>}
                                            </div>
                                        </div>
                                        {trip.creatorId === myId && m.id !== myId && (
                                            <button onClick={() => handleRemoveMember(m.id)}
                                                className="p-2 text-rose-400/40 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors">
                                                <span className="material-symbols-outlined text-base">person_remove</span>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default Dashboard;

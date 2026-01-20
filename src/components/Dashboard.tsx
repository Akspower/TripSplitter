import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { BanknotesIcon, UsersIcon, SparklesIcon, ArrowRightIcon, ArrowPathIcon, TrashIcon, HandThumbUpIcon, PlusIcon, ChartBarIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { calculateDebts } from '../utils/debtCalculator';
import { getTripInsights } from '../services/groqService';
import { formatINR } from '../utils/formatters';
import type { Trip } from '../types';
import Analytics from './Analytics';
import { TripService } from '../services/tripService';

import toast from 'react-hot-toast';
import ConfirmDialog from './ui/ConfirmDialog';


const Dashboard: React.FC<{ trip: Trip, myId: string, onAddExpense: () => void, onDeleteExpense: (id: string) => void }> = ({ trip, myId, onAddExpense, onDeleteExpense }) => {
    const [activeTab, setActiveTab] = useState<'expenses' | 'summary' | 'insights' | 'analytics'>('expenses');
    const [insights, setInsights] = useState<string | null>(null);
    const [loadingInsights, setLoadingInsights] = useState(false);
    const [showManageTeam, setShowManageTeam] = useState(false);

    // Optimistic UI state for deleted members
    const [hiddenMemberIds, setHiddenMemberIds] = useState<Set<string>>(new Set());

    // Filtered members for UI
    const displayedMembers = useMemo(() => {
        return trip.members.filter(m => !hiddenMemberIds.has(m.id));
    }, [trip.members, hiddenMemberIds]);

    // Cleanup optimistic state when trip updates from server
    useEffect(() => {
        setHiddenMemberIds(prev => {
            const next = new Set(prev);
            // If server update confirms deletion (id not in trip.members), remove from hidden set to keep it clean
            // Actually, if it's gone from trip.members, we don't need to hide it anymore.
            // So we can just clear ids that are no longer in trip.members.
            const currentIds = new Set(trip.members.map(m => m.id));
            for (const id of next) {
                if (!currentIds.has(id)) {
                    next.delete(id);
                }
            }
            return next;
        });
    }, [trip.members]);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; title: string; message: string; onConfirm: () => void; isDestructive?: boolean }>({
        isOpen: false, title: '', message: '', onConfirm: () => { }, isDestructive: false
    });

    const prevExpenseCount = useRef(trip.expenses.length);

    // --- Core Personal Budget Logic ---
    const tripTotal = useMemo(() => trip.expenses.reduce((sum, e) => sum + e.amount, 0), [trip]);

    const myConsumption = useMemo(() => {
        return trip.expenses.reduce((sum, e) => {
            if (e.participantIds.includes(myId)) {
                return sum + (e.amount / e.participantIds.length);
            }
            return sum;
        }, 0);
    }, [trip, myId]);

    const myPayments = useMemo(() => {
        return trip.expenses.reduce((sum, e) => {
            if (e.payerId === myId) return sum + e.amount;
            return sum;
        }, 0);
    }, [trip, myId]);

    const myBalance = myPayments - myConsumption;

    const debts = useMemo(() => calculateDebts(trip), [trip]);

    const fetchInsights = useCallback(async (force = false) => {
        if (insights && !force) return;
        setLoadingInsights(true);
        try {
            const data = await getTripInsights(trip);
            setInsights(data || "No insights found.");
        } catch (e) {
            console.error(e);
            setInsights("Could not fetch insights at this time.");
        } finally {
            setLoadingInsights(false);
        }
        setLoadingInsights(false);
    }, [trip]);

    const handleRemoveMember = async (memberId: string) => {
        setConfirmModal({
            isOpen: true,
            title: 'Remove Member?',
            message: 'This will delete their payments and remove them from all splits. This cannot be undone.',
            isDestructive: true,
            onConfirm: async () => {
                // Optimistic Close
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
                const toastId = toast.loading('Removing member...');

                // Optimistic UI Update: Hide immediately
                setHiddenMemberIds(prev => new Set(prev).add(memberId));

                // Allow UI to update before async work (small delay/tick not strictly needed but safe)

                const success = await TripService.removeMember(trip.id, memberId);

                if (success) {
                    toast.success('Member removed!', { id: toastId });
                    // Keep hidden (it is already in hiddenMemberIds)
                    // Server update will eventually come and sync state
                } else {
                    toast.error('Could not remove member.', { id: toastId });
                    // Revert optimistic update
                    setHiddenMemberIds(prev => {
                        const next = new Set(prev);
                        next.delete(memberId);
                        return next;
                    });
                }
            }
        });
    };

    // Fetch on tab open
    useEffect(() => {
        if (activeTab === 'insights' && !insights) {
            fetchInsights();
        }
    }, [activeTab]);

    // Auto-refresh insights when expenses change (but only if insights tab was viewed)
    useEffect(() => {
        if (trip.expenses.length !== prevExpenseCount.current && insights) {
            prevExpenseCount.current = trip.expenses.length;
            // Delay refresh to let UI settle
            const timer = setTimeout(() => fetchInsights(true), 1000);
            return () => clearTimeout(timer);
        }
    }, [trip.expenses.length]);

    const getUPILink = (payeeName: string, amount: number) => {
        // This is a generic intent link. In a real app, you'd store the user's UPI ID.
        // For now, we leave the PA (Payee Address) empty so the user can fill it, or use a placeholder.
        // Or we can prompt the user to ask their friend for their UPI ID.
        return `upi://pay?pa=&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(`Settlement for ${trip.name}`)}`;
    };

    return (
        <div className="pb-40 px-4 md:px-6 pt-10 max-w-7xl mx-auto w-full overflow-hidden">
            <ConfirmDialog
                isOpen={confirmModal.isOpen}
                title={confirmModal.title}
                message={confirmModal.message}
                isDestructive={confirmModal.isDestructive}
                onConfirm={confirmModal.onConfirm}
                onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            />
            {/* ... Rest of JSX ... */}
            <div className="lg:grid lg:grid-cols-12 lg:gap-10 lg:items-start">
                {/* Left Column - Net Standing */}
                <div className="lg:col-span-5 space-y-6 mb-12 lg:mb-0 lg:sticky lg:top-28">
                    <div className="bg-white p-8 rounded-[48px] border border-white shadow-2xl shadow-slate-200 card-3d">
                        <div className="flex justify-between items-start mb-10">
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">My Net Standing</p>
                                <h2 className={`text-5xl font-black tracking-tighter ${myBalance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {myBalance >= 0 ? '+' : ''}{formatINR(myBalance)}
                                </h2>
                                <div className="mt-2 flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${myBalance >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                    <span className="text-[11px] font-bold text-slate-400">{myBalance >= 0 ? 'You are getting back' : 'You owe to the squad'}</span>
                                </div>
                            </div>
                            <div className="bg-slate-900 px-6 py-4 rounded-[32px] shadow-2xl shadow-slate-300 text-center flex flex-col items-center">
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Group Spend</span>
                                <span className="text-xl font-black text-white">{formatINR(tripTotal)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 border-t border-slate-50 pt-10">
                            <div className="relative overflow-hidden p-6 bg-slate-50 rounded-[32px]">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Your Personal usage</p>
                                <p className="text-2xl font-black text-slate-900">{formatINR(myConsumption)}</p>
                                <div className="mt-1 h-1 w-full bg-slate-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, (myConsumption / tripTotal || 0) * 100)}%` }}></div>
                                </div>
                            </div>
                            <div className="relative overflow-hidden p-6 bg-indigo-50 rounded-[32px]">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">Total You Paid</p>
                                <p className="text-2xl font-black text-indigo-600">{formatINR(myPayments)}</p>
                                <BanknotesIcon className="absolute -right-2 -bottom-2 w-16 h-16 text-indigo-100/50 -rotate-12" />
                            </div>
                        </div>
                    </div>
                </div>


                {/* Right Column - Tabs & Content */}
                <div className="lg:col-span-7 w-full">

                    {/* Pill Navigation */}
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-10 p-2 bg-slate-200/40 rounded-[36px] border border-slate-200/50 backdrop-blur-md">
                        {[
                            { id: 'expenses', label: 'Expenses', icon: BanknotesIcon },
                            { id: 'summary', label: 'Settlement', icon: UsersIcon },
                            { id: 'analytics', label: 'Analytics', icon: ChartBarIcon },
                            { id: 'insights', label: 'Trip Guide', icon: SparklesIcon }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`flex-1 flex items-center justify-center gap-3 px-8 py-5 rounded-[30px] font-black text-sm transition-all duration-300 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-2xl scale-[1.05]' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'text-indigo-600' : ''}`} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {activeTab === 'analytics' && <Analytics trip={trip} myId={myId} />}

                        {activeTab === 'expenses' && (
                            <div className="space-y-4">
                                {trip.expenses.length === 0 ? (
                                    <div className="text-center py-32 bg-white/40 rounded-[48px] border-4 border-dashed border-slate-200">
                                        <div className="bg-slate-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <BanknotesIcon className="w-10 h-10 text-slate-300" />
                                        </div>
                                        <p className="text-slate-500 font-bold text-lg tracking-tight">Your expense feed is empty.</p>
                                        <button onClick={onAddExpense} className="text-indigo-600 font-black mt-3 text-sm uppercase tracking-[0.2em] hover:tracking-[0.3em] transition-all">Add First Bill</button>
                                    </div>
                                ) : (
                                    trip.expenses.slice().reverse().map(e => (
                                        <div key={e.id} className={`bg-white p-6 rounded-[40px] border border-white shadow-xl shadow-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between group card-3d ${!e.participantIds.includes(myId) ? 'opacity-40 grayscale-[0.8]' : ''}`}>
                                            <div className="flex items-center gap-6 w-full sm:w-auto">
                                                <div className="w-16 h-16 bg-slate-50 rounded-[28px] flex items-center justify-center text-3xl shadow-inner group-hover:bg-indigo-50 transition-colors shrink-0">
                                                    {e.category === 'Food' && '🍛'}
                                                    {e.category === 'Drink' && '🥤'}
                                                    {e.category === 'Alcohol' && '🍺'}
                                                    {e.category === 'Cab/Taxi' && '🚕'}
                                                    {e.category === 'Train/Bus/Flight' && '✈️'}
                                                    {e.category === 'Hotel/Stay' && '🏨'}
                                                    {e.category === 'Trekking Gear' && '🥾'}
                                                    {e.category === 'Entry Fee' && '🎟️'}
                                                    {e.category === 'Shopping' && '🛍️'}
                                                    {e.category === 'Other' && '📍'}
                                                    {/* Fallback */}
                                                    {!['Food', 'Drink', 'Alcohol', 'Cab/Taxi', 'Train/Bus/Flight', 'Hotel/Stay', 'Trekking Gear', 'Entry Fee', 'Shopping', 'Other'].includes(e.category) && '🧾'}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-slate-900 text-lg tracking-tight leading-none mb-1 break-words line-clamp-2">{e.description}</h4>
                                                    <p className="text-[10px] font-bold text-slate-400 mb-2">{new Date(e.date).toLocaleDateString('en-IN', { weekday: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                                                    <div className="flex flex-wrap items-center gap-2">
                                                        <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${e.payerId === myId ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                                                            {e.payerId === myId ? 'You Paid' : trip.members.find(m => m.id === e.payerId)?.name || 'Unknown'}
                                                        </span>
                                                        {!e.participantIds.includes(myId) && (
                                                            <span className="text-[9px] font-black bg-rose-50 text-rose-500 px-3 py-1 rounded-full uppercase tracking-widest">Not For You</span>
                                                        )}
                                                        {e.participantIds.includes(myId) && (
                                                            <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full uppercase tracking-widest">In Your share</span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-5 mt-4 sm:mt-0 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="text-right">
                                                    <span className="block text-2xl font-black text-slate-900">{formatINR(e.amount)}</span>
                                                    {e.participantIds.includes(myId) && (
                                                        <span className="text-[11px] text-indigo-500 font-black">₹{(e.amount / e.participantIds.length).toFixed(0)} each</span>
                                                    )}
                                                </div>
                                                {(e.createdBy === myId || trip.creatorId === myId) && (
                                                    <button onClick={() => onDeleteExpense(e.id)} className="opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity p-3 bg-rose-50 text-rose-400 rounded-2xl hover:bg-rose-500 hover:text-white">
                                                        <TrashIcon className="w-5 h-5" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeTab === 'summary' && (
                            <div className="space-y-6">
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowManageTeam(true)}
                                        className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2 hover:bg-indigo-100"
                                    >
                                        <Cog6ToothIcon className="w-4 h-4" />
                                        Manage Team
                                    </button>
                                </div>
                                <div className="bg-white p-10 rounded-[48px] shadow-2xl shadow-slate-100 border border-white">
                                    <h3 className="text-2xl font-black text-slate-900 mb-10 flex items-center gap-4">
                                        <UsersIcon className="w-8 h-8 text-indigo-500" /> Settlement Plan
                                    </h3>
                                    <div className="space-y-4">
                                        {debts.length === 0 ? (
                                            <div className="text-center py-20">
                                                <div className="bg-emerald-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                                                    <HandThumbUpIcon className="w-12 h-12 text-emerald-500" />
                                                </div>
                                                <p className="text-slate-400 font-black text-xl">Perfectly Balanced! 🎉</p>
                                            </div>
                                        ) : (
                                            debts.map((d, idx) => (
                                                <div key={idx} className={`relative overflow-hidden group flex flex-col sm:flex-row items-center justify-between p-5 sm:p-8 rounded-[32px] sm:rounded-[40px] border transition-all duration-300 ${d.from === myId || d.to === myId ? 'bg-indigo-50/80 border-indigo-200 shadow-xl shadow-indigo-100/50 scale-[1.01]' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>

                                                    {/* Decorator for active user */}
                                                    {(d.from === myId || d.to === myId) && <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500"></div>}

                                                    <div className="flex items-center gap-3 sm:gap-6 mb-4 sm:mb-0 w-full sm:w-auto">
                                                        {/* From Avatar */}
                                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner shrink-0 ${d.from === myId ? 'bg-gradient-to-br from-rose-400 to-rose-600 text-white shadow-rose-200' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                            {trip.members.find(m => m.id === d.from)?.name.charAt(0)}
                                                        </div>

                                                        {/* Arrow */}
                                                        <div className="bg-indigo-50 p-1.5 sm:p-2 rounded-full shrink-0 rotate-90 sm:rotate-0">
                                                            <ArrowRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-400" />
                                                        </div>

                                                        {/* To Avatar */}
                                                        <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner shrink-0 ${d.to === myId ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
                                                            {trip.members.find(m => m.id === d.to)?.name.charAt(0)}
                                                        </div>

                                                        {/* Text Info - Truncated */}
                                                        <div className="ml-1 sm:ml-2 min-w-0 flex-1">
                                                            <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-0.5 truncate">
                                                                {d.from === myId ? 'YOU OWE' : trip.members.find(m => m.id === d.from)?.name}
                                                            </p>
                                                            <p className="text-base sm:text-lg font-black text-slate-800 truncate leading-tight">
                                                                To {d.to === myId ? 'YOU' : trip.members.find(m => m.id === d.to)?.name}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {/* Amount & Action */}
                                                    <div className="w-full sm:w-auto text-right border-t sm:border-t-0 border-slate-100 pt-3 sm:pt-0 mt-2 sm:mt-0 flex flex-col items-end gap-2">
                                                        <span className={`text-2xl sm:text-3xl font-black block sm:inline ${d.from === myId ? 'text-rose-600' : (d.to === myId ? 'text-emerald-600' : 'text-slate-900')}`}>
                                                            {formatINR(d.amount)}
                                                        </span>

                                                        {d.from === myId && (
                                                            <a
                                                                href={getUPILink(trip.members.find(m => m.id === d.to)?.name || '', d.amount)}
                                                                className="bg-slate-900 text-white text-[10px] font-bold px-4 py-2 rounded-full uppercase tracking-widest hover:bg-indigo-600 transition-colors flex items-center gap-1"
                                                            >
                                                                Pay Now <ArrowRightIcon className="w-3 h-3" />
                                                            </a>
                                                        )}

                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block sm:hidden">to settle</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'insights' && (
                            <div className="bg-slate-900 p-10 rounded-[48px] text-white shadow-2xl relative overflow-hidden">
                                <SparklesIcon className="absolute -right-10 -top-10 w-64 h-64 text-indigo-500/10 rotate-12" />
                                <div className="flex items-center justify-between mb-12 relative z-10">
                                    <div>
                                        <h3 className="text-3xl font-black flex items-center gap-4">AI Trip Guide</h3>
                                        <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Smart Analysis & Local Hacks</p>
                                    </div>
                                    <button onClick={() => { setInsights(null); fetchInsights(); }} className="bg-white/10 p-4 rounded-3xl hover:bg-white/20 transition-all active:rotate-180 duration-500">
                                        <ArrowPathIcon className={`w-8 h-8 ${loadingInsights ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                                {loadingInsights ? (
                                    <div className="py-12 px-2 sm:px-6 relative z-10 space-y-6">
                                        <div className="h-8 w-3/4 animate-shimmer rounded-xl"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 w-full animate-shimmer rounded-lg"></div>
                                            <div className="h-4 w-5/6 animate-shimmer rounded-lg"></div>
                                            <div className="h-4 w-4/6 animate-shimmer rounded-lg"></div>
                                        </div>

                                        <div className="pt-4 flex gap-4">
                                            <div className="h-24 w-1/3 animate-shimmer rounded-2xl"></div>
                                            <div className="h-24 w-1/3 animate-shimmer rounded-2xl"></div>
                                            <div className="h-24 w-1/3 animate-shimmer rounded-2xl"></div>
                                        </div>

                                        <div className="text-center pt-8">
                                            <p className="animate-pulse font-black text-xl text-indigo-200 tracking-tight">Crafting Your Strategy...</p>
                                            <p className="text-slate-500 text-xs sm:text-sm mt-2 font-bold uppercase tracking-widest">Parsing {trip.expenses.length} expenses & finding hacks</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="prose prose-invert max-w-none text-indigo-50/80 italic leading-relaxed whitespace-pre-line text-lg sm:text-xl font-medium relative z-10 animate-in fade-in duration-700 slide-in-from-bottom-4">
                                        {insights || "Tap the refresh icon and Gemini will tell you who's spending too much and give you secret local hacks for your destination!"}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 3D Glass Dock */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[92%] max-w-lg z-40">
                <div className="glass px-6 py-4 rounded-[36px] border border-white/50 shadow-2xl flex items-center justify-between floating-dock bg-white/80 backdrop-blur-lg">
                    <div className="flex gap-4 sm:gap-6 shrink-0">
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active Room</span>
                            <span className="text-base sm:text-lg font-black text-slate-900 tracking-tighter">{trip.id}</span>
                        </div>
                        <div className="h-10 w-px bg-slate-200 self-center"></div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Logged As</span>
                            <span className="text-base sm:text-lg font-black text-indigo-600 tracking-tighter truncate max-w-[80px] sm:max-w-none">{trip.members.find(m => m.id === myId)?.name.split(' ')[0]}</span>
                        </div>
                    </div>
                    <button
                        onClick={onAddExpense}
                        className="bg-slate-900 text-white px-6 sm:px-10 py-4 sm:py-5 rounded-[28px] font-black text-md sm:text-lg flex items-center gap-2 sm:gap-3 shadow-2xl hover:bg-indigo-600 transition-all active:scale-90"
                    >
                        <PlusIcon className="w-5 h-5 sm:w-6 sm:h-6" /> <span className="hidden sm:inline">Log Bill</span><span className="sm:hidden">Add</span>
                    </button>
                </div>
            </div>
            {/* Team Management Modal */}
            {showManageTeam && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-[32px] p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Team Members</h3>
                            <button onClick={() => setShowManageTeam(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200">
                                <XMarkIcon className="w-5 h-5 text-slate-500" />
                            </button>
                        </div>

                        <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
                            {displayedMembers.map(m => (
                                <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-[20px] border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${m.isCreator ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {m.isCreator ? '👑' : m.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900">{m.name}</p>
                                            {m.isCreator && <p className="text-[10px] font-black text-amber-500 uppercase">Admin</p>}
                                        </div>
                                    </div>
                                    {/* Delete Button: Only if I am Creator, and Target is NOT me */}
                                    {trip.creatorId === myId && m.id !== myId && (
                                        <button
                                            onClick={() => handleRemoveMember(m.id)}
                                            className="p-2 text-rose-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                            title="Remove Member"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

import React, { useState } from 'react';
import { TripService } from '../services/tripService';
import type { Trip, Member, TripStyle, BudgetType, AgeGroup } from '../types';
import { getAvatarColor } from './MemberAvatar';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const gradients = [
    'from-violet-500 to-[#b613ec]', 'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600', 'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-600', 'from-cyan-400 to-blue-500',
];

const TOTAL_STEPS = 4;

const TripSetup: React.FC<{ onComplete: (trip: Trip, myId: string) => void; onBack: () => void }> = ({ onComplete, onBack }) => {
    const [step, setStep] = useState(1);
    const [creatorName, setCreatorName] = useState('');
    const [formData, setFormData] = useState({ name: '', destination: '', startDate: '', endDate: '' });
    const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
    const [newMember, setNewMember] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [adminPin, setAdminPin] = useState('');
    const [tripStyle, setTripStyle] = useState<TripStyle>('adventure');
    const [budgetType, setBudgetType] = useState<BudgetType>('moderate');
    const [ageGroup, setAgeGroup] = useState<AgeGroup>('mixed');

    React.useEffect(() => {
        window.history.pushState({ step }, `Step ${step}`, window.location.search);
        const handlePop = (e: PopStateEvent) => {
            if (e.state?.step && e.state.step < step) setStep(e.state.step);
            else if (step === 1) onBack();
            else setStep(step - 1);
        };
        window.addEventListener('popstate', handlePop);
        return () => window.removeEventListener('popstate', handlePop);
    }, [step, onBack]);

    React.useEffect(() => {
        const saved = localStorage.getItem('trip_setup_state');
        if (saved && step === 1) {
            try {
                const p = JSON.parse(saved);
                if (p.step) setStep(p.step);
                if (p.creatorName) setCreatorName(p.creatorName);
                if (p.formData) setFormData(p.formData);
                if (p.members) setMembers(p.members);
                if (p.adminPin) setAdminPin(p.adminPin);
                if (p.tripStyle) setTripStyle(p.tripStyle);
                if (p.budgetType) setBudgetType(p.budgetType);
                if (p.ageGroup) setAgeGroup(p.ageGroup);
            } catch { }
        }
    }, []);

    React.useEffect(() => {
        localStorage.setItem('trip_setup_state', JSON.stringify({ step, creatorName, formData, members, adminPin, tripStyle, budgetType, ageGroup }));
    }, [step, creatorName, formData, members, adminPin, tripStyle, budgetType, ageGroup]);

    const handleNextFromStep2 = () => {
        if (!formData.name.trim()) { toast.error('Enter a trip name'); return; }
        if (!formData.destination.trim()) { toast.error('Enter a destination'); return; }
        if (!formData.startDate) { toast.error('Select a start date'); return; }
        if (!formData.endDate) { toast.error('Select an end date'); return; }
        if (new Date(formData.endDate) < new Date(formData.startDate)) { toast.error('End date must be after start date'); return; }
        setStep(3);
    };

    const addMember = () => {
        const name = newMember.trim();
        if (!name) { toast.error('Enter a member name'); return; }
        if (name.length > 30) { toast.error('Name too long (max 30 chars)'); return; }
        if (members.some(m => m.name.toLowerCase() === name.toLowerCase())) { toast.error(`${name} already added`); return; }
        if (creatorName.toLowerCase() === name.toLowerCase()) { toast.error(`You (${creatorName}) are already in the trip`); return; }
        if (members.length >= 20) { toast.error('Max 20 members'); return; }
        setMembers([...members, { id: Math.random().toString(36).substr(2, 9), name }]);
        setNewMember('');
        toast.success(`✓ ${name} added`);
    };

    const finishSetup = async () => {
        if (members.length === 0) { toast.error('Add at least one other person'); return; }
        if (isCreating) return; // prevent double-tap
        setIsCreating(true);

        const creatorId = Math.random().toString(36).substr(2, 9);
        const tripId = Math.floor(100000 + Math.random() * 900000).toString();
        const allMembers: Member[] = [
            { id: creatorId, name: creatorName, isCreator: true, avatarColor: getAvatarColor(0) },
            ...members.map((m, i) => ({ id: m.id, name: m.name, isCreator: false, avatarColor: getAvatarColor(i + 1) }))
        ];
        const newTrip: Trip = {
            id: tripId, ...formData,
            members: allMembers, expenses: [],
            creatorId, adminPin: adminPin || undefined,
            tripStyle, budgetType, ageGroup
        };

        // Save IDs to localStorage BEFORE network call
        // If network call succeeds but response is lost (PWA backgrounded), state is preserved
        localStorage.setItem('tripId', tripId);
        localStorage.setItem('myId', creatorId);
        localStorage.setItem('cachedTrip', JSON.stringify(newTrip));

        // 12s timeout so the button never sticks forever on slow/no network
        const timeoutPromise = new Promise<{ success: false; error: string }>(resolve =>
            setTimeout(() => resolve({ success: false, error: 'Connection timed out. Check your internet and try again.' }), 12000)
        );

        try {
            const result = await Promise.race([TripService.createTrip(newTrip), timeoutPromise]);
            if (result.success) {
                localStorage.removeItem('trip_setup_state');
                toast.success('Trip created! 🚀');
                onComplete(newTrip, creatorId);
            } else {
                // Clean up pre-saved state on failure
                localStorage.removeItem('tripId');
                localStorage.removeItem('myId');
                localStorage.removeItem('cachedTrip');
                toast.error(result.error || 'Failed to create trip. Please try again.');
                setIsCreating(false);
            }
        } catch (err: unknown) {
            localStorage.removeItem('tripId');
            localStorage.removeItem('myId');
            localStorage.removeItem('cachedTrip');
            toast.error('Something went wrong. Please try again.');
            setIsCreating(false);
        }
    };

    const stepVariants = {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
    };

    // Input class helper
    const inputCls = "w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[#F4F4F8] font-bold focus:outline-none focus:ring-2 focus:ring-[#b613ec]/40 placeholder:text-[rgba(244,244,248,0.2)] text-base";

    return (
        <div className="max-w-md mx-auto p-4 sm:p-6 mt-2 w-full relative">
            {/* Cancel */}
            <div className="flex items-center justify-between mb-8">
                <button onClick={() => { if (step > 1) setStep(step - 1); else { localStorage.removeItem('trip_setup_state'); onBack(); } }}
                    className="w-10 h-10 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.4)] hover:text-[#F4F4F8] transition-colors">
                    <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
                </button>
                <h2 className="text-base font-bold text-[#F4F4F8] tracking-tight">Trip Setup</h2>
                <button onClick={() => { localStorage.removeItem('trip_setup_state'); onBack(); }}
                    className="w-10 h-10 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.4)] hover:text-rose-400 transition-colors">
                    <span className="material-symbols-outlined text-lg">close</span>
                </button>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-3 mb-8">
                {Array.from({ length: TOTAL_STEPS }, (_, i) => (
                    <div key={i} className={`rounded-full transition-all duration-500 ${step === i + 1 ? 'h-2 w-8 bg-[#b613ec] shadow-[0_0_12px_rgba(182,19,236,0.6)]'
                        : step > i + 1 ? 'h-2 w-2 bg-[#b613ec]/50'
                            : 'h-2 w-2 bg-white/15'
                        }`} />
                ))}
            </div>

            <AnimatePresence>
                {step === 1 && (
                    <motion.div key="s1" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-7">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-[#b613ec]/20 border border-[#b613ec]/30 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                <span className="material-symbols-outlined text-[#b613ec] text-3xl">badge</span>
                            </div>
                            <h2 className="text-3xl font-bold text-[#F4F4F8] tracking-tight mb-2">Who are you?</h2>
                            <p className="text-[rgba(244,244,248,0.4)] text-sm">We need your name to calculate your personal share</p>
                        </div>
                        <div className="glass-card rounded-2xl p-5 border border-white/8">
                            <label className="block text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest mb-3">Your Name</label>
                            <input autoFocus type="text" maxLength={30} className={inputCls} placeholder="Ex: Arjun" value={creatorName} onChange={e => setCreatorName(e.target.value)} onKeyDown={e => e.key === 'Enter' && creatorName.trim() && setStep(2)} />
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} disabled={!creatorName.trim()} onClick={() => setStep(2)} className="w-full btn-primary py-5 rounded-full font-bold text-lg disabled:opacity-30">
                            Start Planner →
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Step 2: Trip Details ── */}
                {step === 2 && (
                    <motion.div key="s2" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-5">
                        <div>
                            <h2 className="text-3xl font-bold text-[#F4F4F8] tracking-tight mb-1">Trip Blueprint 🗺️</h2>
                            <p className="text-[rgba(244,244,248,0.4)] text-sm">Where are you headed?</p>
                        </div>
                        <div className="glass-card rounded-2xl p-5 border border-white/8 space-y-1">
                            <label className="block text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest mb-2">Trip Name</label>
                            <input type="text" maxLength={50} className={inputCls} placeholder="Goa Road Trip 🏖️" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="glass-card rounded-2xl p-5 border border-white/8">
                            <label className="block text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest mb-2">Destination</label>
                            <input type="text" maxLength={50} className={inputCls} placeholder="South Goa, India" value={formData.destination} onChange={e => setFormData({ ...formData, destination: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="glass-card rounded-2xl p-4 border border-white/8">
                                <label className="block text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest mb-2">Start Date</label>
                                <input type="date" required className="w-full bg-transparent text-[#F4F4F8] font-bold focus:outline-none text-sm" value={formData.startDate} min={new Date().toISOString().split('T')[0]}
                                    onChange={e => setFormData(prev => ({ ...prev, startDate: e.target.value, endDate: prev.endDate && prev.endDate < e.target.value ? '' : prev.endDate }))} />
                            </div>
                            <div className="glass-card rounded-2xl p-4 border border-white/8">
                                <label className="block text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest mb-2">End Date</label>
                                <input type="date" required className="w-full bg-transparent text-[#F4F4F8] font-bold focus:outline-none text-sm" value={formData.endDate} min={formData.startDate || new Date().toISOString().split('T')[0]}
                                    onChange={e => setFormData({ ...formData, endDate: e.target.value })} />
                            </div>
                        </div>
                        <motion.button whileTap={{ scale: 0.97 }} onClick={handleNextFromStep2} className="w-full btn-primary py-5 rounded-full font-bold text-lg">
                            Add the Squad →
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Step 3: Add Members ── */}
                {step === 3 && (
                    <motion.div key="s3" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-5">
                        <div>
                            <h2 className="text-3xl font-bold text-[#F4F4F8] tracking-tight mb-1">The Squad 👥</h2>
                            <p className="text-[rgba(244,244,248,0.4)] text-sm">Who's coming along?</p>
                        </div>

                        {/* Add input */}
                        <div className="flex gap-3">
                            <input type="text" maxLength={30} className={`${inputCls} flex-1`} placeholder="Friend's name..."
                                value={newMember} onChange={e => setNewMember(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && addMember()} />
                            <button onClick={addMember} className="btn-primary w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-xl">add</span>
                            </button>
                        </div>

                        {/* Members list */}
                        <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                            {/* Creator row */}
                            <div className="flex items-center gap-4 glass-card-primary p-4 rounded-2xl border border-[#b613ec]/20">
                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-[#b613ec] flex items-center justify-center font-bold text-white text-sm">
                                    {creatorName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <span className="font-bold text-[#F4F4F8]">{creatorName}</span>
                                    <p className="text-[10px] font-bold text-[#b613ec] uppercase tracking-widest">You (Admin)</p>
                                </div>
                            </div>
                            {members.map((m, i) => (
                                <div key={m.id} className="flex justify-between items-center glass-card p-4 rounded-2xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br ${gradients[(i + 1) % gradients.length]}`}>
                                            {m.name.charAt(0)}
                                        </div>
                                        <span className="font-bold text-[#F4F4F8] text-sm">{m.name}</span>
                                    </div>
                                    <button onClick={() => setMembers(members.filter(mem => mem.id !== m.id))}
                                        className="p-2 text-rose-400/40 hover:text-rose-400 hover:bg-rose-400/10 rounded-xl transition-colors">
                                        <span className="material-symbols-outlined text-base">person_remove</span>
                                    </button>
                                </div>
                            ))}
                        </div>

                        <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(4)} disabled={members.length === 0} className="w-full btn-primary py-5 rounded-full font-bold text-lg disabled:opacity-30">
                            Trip Settings →
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Step 4: Trip Profile ── */}
                {step === 4 && (
                    <motion.div key="s4" variants={stepVariants} initial="initial" animate="animate" exit="exit" transition={{ duration: 0.2 }} className="space-y-5">
                        <div>
                            <h2 className="text-3xl font-bold text-[#F4F4F8] tracking-tight mb-1">Trip Profile ✨</h2>
                            <p className="text-[rgba(244,244,248,0.4)] text-sm">Help our AI give you better suggestions</p>
                        </div>

                        {/* Trip Vibe */}
                        <div className="glass-card rounded-2xl p-5 border border-white/8">
                            <label className="block text-[10px] font-bold text-[#b613ec] uppercase tracking-widest mb-3">Trip Vibe</label>
                            <div className="grid grid-cols-2 gap-2.5">
                                {[{ v: 'adventure', l: '🏔️ Adventure', d: 'Thrills & Explore' }, { v: 'relaxed', l: '🏖️ Relaxed', d: 'Chill & Unwind' }, { v: 'budget', l: '💰 Budget', d: 'Max Value' }, { v: 'luxury', l: '✨ Luxury', d: 'Premium Experience' }].map(opt => (
                                    <button key={opt.v} onClick={() => setTripStyle(opt.v as TripStyle)}
                                        className={`p-4 rounded-2xl text-left transition-all duration-200 ${tripStyle === opt.v ? 'bg-[#b613ec] shadow-lg shadow-[#b613ec]/30' : 'bg-white/5 hover:bg-white/8'}`}>
                                        <span className="font-bold text-sm text-[#F4F4F8] block">{opt.l}</span>
                                        <span className="text-[10px] text-[rgba(244,244,248,0.5)]">{opt.d}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Budget Style */}
                        <div className="glass-card rounded-2xl p-5 border border-white/8">
                            <label className="block text-[10px] font-bold text-[#b613ec] uppercase tracking-widest mb-3">Budget Style</label>
                            <div className="flex gap-2">
                                {[{ v: 'backpacker', l: '🎒 Backpacker' }, { v: 'moderate', l: '⚖️ Moderate' }, { v: 'splurge', l: '💎 Splurge' }].map(opt => (
                                    <button key={opt.v} onClick={() => setBudgetType(opt.v as BudgetType)}
                                        className={`flex-1 py-3.5 px-2 rounded-2xl font-bold text-xs transition-all ${budgetType === opt.v ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25' : 'bg-white/5 text-[rgba(244,244,248,0.4)]'}`}>
                                        {opt.l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Admin PIN */}
                        <div className="glass-card rounded-2xl p-5 border border-white/8">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="material-symbols-outlined text-[rgba(244,244,248,0.35)] text-lg">lock</span>
                                <label className="text-[10px] font-bold text-[rgba(244,244,248,0.35)] uppercase tracking-widest">Admin PIN (Optional)</label>
                            </div>
                            <input type="password" maxLength={4}
                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-[#F4F4F8] font-bold text-2xl text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#b613ec]/40 placeholder:text-[rgba(244,244,248,0.2)]"
                                placeholder="••••" value={adminPin}
                                onChange={e => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))} />
                            <p className="text-[rgba(244,244,248,0.25)] text-xs mt-2 text-center">Protects admin actions. Leave blank to skip.</p>
                        </div>

                        <motion.button whileTap={{ scale: 0.97 }} disabled={isCreating} onClick={finishSetup}
                            className="w-full btn-primary py-5 rounded-full font-bold text-lg disabled:opacity-60 disabled:animate-pulse">
                            {isCreating ? 'Creating Trip...' : '🚀 Launch Trip'}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TripSetup;

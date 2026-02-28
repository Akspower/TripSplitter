import React, { useState } from 'react';
import { TripService } from '../services/tripService';
import type { Trip } from '../types';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const gradients = [
    'from-violet-500 to-[#b613ec]', 'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600', 'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-600', 'from-cyan-400 to-blue-500',
];

const TripJoin: React.FC<{ onJoin: (trip: Trip, myId: string) => void; onBack: () => void; initialTripId?: string }> = ({ onJoin, onBack, initialTripId }) => {
    const [step, setStep] = useState(1);
    const [tripId, setTripId] = useState(initialTripId || '');
    const [guestName, setGuestName] = useState('');
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [foundTrip, setFoundTrip] = useState<Trip | null>(null);
    const [pinEntry, setPinEntry] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);

    React.useEffect(() => {
        if (initialTripId) handleFetchTrip(initialTripId);
    }, [initialTripId]);

    const handleFetchTrip = async (id: string) => {
        const trimmedId = id.trim();
        if (!trimmedId) { toast.error('Please enter a Room ID'); return; }
        if (trimmedId.length !== 6 || !/^\d{6}$/.test(trimmedId)) { toast.error('Room ID must be 6 digits'); return; }
        setIsJoining(true); setError('');
        const result = await TripService.getTrip(trimmedId);
        if (result.success && result.trip) { setFoundTrip(result.trip); setStep(2); }
        else { toast.error('Trip not found. Check the Room ID.'); if (initialTripId) setTripId(''); }
        setIsJoining(false);
    };

    const claimMember = (memberId: string) => {
        if (!foundTrip) return;
        const member = foundTrip.members.find(m => m.id === memberId);
        if (member?.isCreator && foundTrip.adminPin) { setPendingMemberId(memberId); setShowPinModal(true); setPinEntry(''); setError(''); }
        else onJoin(foundTrip, memberId);
    };

    const verifyPinAndJoin = () => {
        if (!foundTrip || !pendingMemberId) return;
        if (pinEntry === foundTrip.adminPin) onJoin(foundTrip, pendingMemberId);
        else { setError('Incorrect Admin PIN'); setPinEntry(''); }
    };

    const handleJoinNew = async () => {
        if (!foundTrip) return;
        const trimmedName = guestName.trim();
        if (!trimmedName) { toast.error('Please enter your name'); return; }
        if (trimmedName.length > 30) { toast.error('Name too long (max 30 chars)'); return; }
        if (foundTrip.members.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())) { toast.error(`"${trimmedName}" is already taken`); return; }
        setIsJoining(true); setError('');
        const myId = Math.random().toString(36).substr(2, 9);
        const result = await TripService.joinTrip(foundTrip.id, { id: myId, name: trimmedName, isCreator: false });
        if (result.success && result.trip) { toast.success(`Welcome to ${foundTrip.name}!`); onJoin(result.trip, myId); }
        else { toast.error('Could not join trip. Try again.'); setIsJoining(false); }
    };

    return (
        <div className="max-w-md mx-auto p-4 sm:p-6 mt-4 w-full">
            {/* Back button */}
            <button onClick={onBack} className="flex items-center gap-2 text-[rgba(244,244,248,0.4)] font-bold mb-8 hover:text-[#F4F4F8] transition-colors text-sm">
                <span className="material-symbols-outlined text-lg">arrow_back_ios_new</span>
                Back
            </button>

            <AnimatePresence>
                {step === 1 && (
                    <motion.div key="step1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-6">
                        <div>
                            <h2 className="text-3xl font-bold text-[#F4F4F8] tracking-tight mb-1">Enter Room ID</h2>
                            <p className="text-[rgba(244,244,248,0.4)] text-sm">6-digit code shared by the trip creator</p>
                        </div>

                        <div className="glass-card-primary rounded-2xl p-5 border border-[#b613ec]/20">
                            <input
                                autoFocus
                                type="text"
                                maxLength={6}
                                className="w-full bg-transparent text-[#F4F4F8] text-4xl font-bold text-center tracking-[0.5em] focus:outline-none placeholder:text-[rgba(244,244,248,0.15)]"
                                placeholder="• • • • • •"
                                value={tripId}
                                onChange={e => { setTripId(e.target.value.replace(/\D/g, '')); setError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleFetchTrip(tripId)}
                            />
                        </div>

                        {error && <p className="text-rose-400 font-bold text-center text-sm bg-rose-400/10 p-3 rounded-xl border border-rose-400/20">{error}</p>}

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={tripId.length < 6 || isJoining}
                            onClick={() => handleFetchTrip(tripId)}
                            className="w-full btn-primary py-5 rounded-full font-bold text-lg disabled:opacity-40"
                        >
                            {isJoining ? 'Finding Room...' : 'Find Room'}
                        </motion.button>
                    </motion.div>
                )}

                {/* ── Step 2: Pick identity ── */}
                {step === 2 && foundTrip && (
                    <motion.div key="step2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="space-y-5 relative">

                        {/* PIN Modal */}
                        <AnimatePresence>
                            {showPinModal && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.92 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.92 }}
                                    className="absolute inset-0 z-50 bg-[#0d0817]/95 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center p-6 border border-white/10"
                                >
                                    <div className="w-14 h-14 glass-card-primary rounded-2xl flex items-center justify-center mb-4 border border-[#b613ec]/30">
                                        <span className="material-symbols-outlined text-[#b613ec] text-2xl">lock</span>
                                    </div>
                                    <h3 className="text-xl font-bold text-[#F4F4F8] mb-1">Admin Security</h3>
                                    <p className="text-[rgba(244,244,248,0.4)] text-sm mb-5 text-center">Enter 4-digit PIN for this profile</p>
                                    <input
                                        autoFocus type="password" maxLength={4}
                                        className="w-36 bg-white/10 border border-white/10 rounded-2xl px-4 py-4 text-[#F4F4F8] font-bold text-3xl text-center tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#b613ec]/40 mb-4"
                                        placeholder="••••"
                                        value={pinEntry}
                                        onChange={e => { setPinEntry(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                                    />
                                    {error && <p className="text-rose-400 font-bold text-sm mb-4 animate-pulse">{error}</p>}
                                    <div className="flex gap-3 w-full">
                                        <button onClick={() => setShowPinModal(false)} className="flex-1 py-3.5 rounded-2xl font-bold text-[rgba(244,244,248,0.4)] glass-pill border border-white/10 text-sm">Cancel</button>
                                        <button onClick={verifyPinAndJoin} className="flex-[2] btn-primary py-3.5 rounded-2xl font-bold text-sm">Unlock</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div>
                            <h2 className="text-3xl font-bold text-[#F4F4F8] tracking-tight mb-1">Who are you?</h2>
                            <p className="text-[rgba(244,244,248,0.4)] text-sm">Select your name or join as new member</p>
                        </div>

                        {/* Trip info pill */}
                        <div className="glass-card-primary rounded-2xl p-4 border border-[#b613ec]/20 flex items-center gap-3">
                            <div className="w-10 h-10 bg-[#b613ec]/20 rounded-xl flex items-center justify-center">
                                <span className="material-symbols-outlined text-[#b613ec] text-xl">flight_takeoff</span>
                            </div>
                            <div>
                                <p className="font-bold text-[#F4F4F8] text-sm">{foundTrip.name}</p>
                                <p className="text-[10px] text-[rgba(244,244,248,0.4)] font-bold uppercase tracking-widest">{foundTrip.destination} • {foundTrip.members.length} members</p>
                            </div>
                        </div>

                        {/* Existing members */}
                        <div className="grid gap-2.5 max-h-60 overflow-y-auto pr-1">
                            {foundTrip.members.map((m, i) => (
                                <button key={m.id} onClick={() => claimMember(m.id)}
                                    className="flex items-center gap-4 glass-card p-4 rounded-2xl border border-white/5 hover:border-[#b613ec]/30 transition-all text-left active:scale-[0.98]"
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-white bg-gradient-to-br ${gradients[i % gradients.length]}`}>
                                        {m.isCreator ? '👑' : m.name.charAt(0)}
                                    </div>
                                    <div>
                                        <span className="font-bold text-[#F4F4F8] text-sm block">{m.name}</span>
                                        {m.isCreator && <span className="text-[10px] uppercase tracking-widest font-bold text-[#b613ec]">Trip Admin</span>}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Divider */}
                        <div className="relative py-1">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                            <div className="relative flex justify-center"><span className="px-4 bg-[#0A0A0F] text-[10px] font-bold text-[rgba(244,244,248,0.3)] uppercase tracking-widest">Or join as new</span></div>
                        </div>

                        {/* New member input */}
                        <div className="glass-card rounded-2xl p-4 border border-white/5">
                            <input
                                type="text" maxLength={30}
                                className="w-full bg-transparent text-[#F4F4F8] font-bold text-xl focus:outline-none placeholder:text-[rgba(244,244,248,0.2)]"
                                placeholder="Enter your name..."
                                value={guestName}
                                onChange={e => setGuestName(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && guestName.trim() && handleJoinNew()}
                            />
                        </div>

                        <motion.button
                            whileTap={{ scale: 0.97 }}
                            disabled={!guestName.trim() || isJoining}
                            onClick={handleJoinNew}
                            className="w-full btn-primary py-5 rounded-full font-bold text-lg disabled:opacity-40"
                        >
                            {isJoining ? 'Joining...' : 'Join as New Member'}
                        </motion.button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default TripJoin;

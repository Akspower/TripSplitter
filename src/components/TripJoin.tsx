import React, { useState } from 'react';
import { TripService } from '../services/tripService';
import type { Trip } from '../types';

const TripJoin: React.FC<{ onJoin: (trip: Trip, myId: string) => void, onBack: () => void }> = ({ onJoin, onBack }) => {
    const [step, setStep] = useState(1);
    const [tripId, setTripId] = useState('');
    const [guestName, setGuestName] = useState('');
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const [foundTrip, setFoundTrip] = useState<Trip | null>(null);
    const [pinEntry, setPinEntry] = useState('');
    const [showPinModal, setShowPinModal] = useState(false);
    const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);

    const fetchTripMembers = async () => {
        setIsJoining(true);
        setError('');
        const result = await TripService.getTrip(tripId.trim());

        if (result.success && result.trip) {
            setFoundTrip(result.trip);
            setStep(2);
        } else {
            setError('Trip not found. Check the ID.');
        }
        setIsJoining(false);
    };

    const claimMember = (memberId: string) => {
        if (!foundTrip) return;

        const member = foundTrip.members.find(m => m.id === memberId);
        if (member?.isCreator && foundTrip.adminPin) {
            setPendingMemberId(memberId);
            setShowPinModal(true);
            setPinEntry('');
            setError('');
        } else {
            onJoin(foundTrip, memberId);
        }
    };

    const verifyPinAndJoin = () => {
        if (!foundTrip || !pendingMemberId) return;

        if (pinEntry === foundTrip.adminPin) {
            onJoin(foundTrip, pendingMemberId);
        } else {
            setError('Incorrect Admin PIN');
            setPinEntry('');
        }
    };

    const handleJoinNew = async () => {
        if (!foundTrip) return;
        setIsJoining(true);
        setError('');

        const myId = Math.random().toString(36).substr(2, 9);
        const result = await TripService.joinTrip(foundTrip.id, {
            id: myId,
            name: guestName.trim(),
            isCreator: false
        });

        if (result.success && result.trip) {
            onJoin(result.trip, myId);
        } else {
            setError('Could not join trip.');
        }
        setIsJoining(false);
    };

    return (
        <div className="max-w-md mx-auto p-4 sm:p-8 mt-10 w-full">
            <button onClick={onBack} className="text-slate-400 font-bold mb-8 hover:text-slate-800 transition-colors">← Back</button>

            {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-8">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter">Enter Room ID</h2>
                    <div className="bg-white p-6 rounded-[32px] shadow-xl border border-white">
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-3xl tracking-widest text-center uppercase"
                            placeholder="123456"
                            value={tripId}
                            onChange={(e) => { setTripId(e.target.value); setError(''); }}
                        />
                    </div>
                    {error && <p className="text-rose-500 font-bold text-center bg-rose-50 p-3 rounded-xl">{error}</p>}

                    <button
                        disabled={tripId.length < 3 || isJoining}
                        onClick={fetchTripMembers}
                        className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl disabled:opacity-30"
                    >
                        {isJoining ? 'Finding...' : 'Find Room'}
                    </button>
                </div>
            )}

            {step === 2 && foundTrip && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8 relative">
                    {showPinModal && (
                        <div className="absolute inset-0 z-50 bg-white/95 backdrop-blur-sm rounded-[32px] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                            <h3 className="text-2xl font-black text-slate-900 mb-2">Admin Security</h3>
                            <p className="text-slate-500 text-sm mb-6 text-center font-bold">Enter 4-digit PIN to access this profile</p>

                            <input
                                autoFocus
                                type="password"
                                maxLength={4}
                                className="w-48 bg-slate-100 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-3xl text-center tracking-[0.5em] mb-6"
                                placeholder="••••"
                                value={pinEntry}
                                onChange={(e) => { setPinEntry(e.target.value.replace(/\D/g, '').slice(0, 4)); setError(''); }}
                            />

                            {error && <p className="text-rose-500 font-bold text-sm mb-4 animate-pulse">{error}</p>}

                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowPinModal(false)} className="flex-1 py-4 rounded-xl font-bold text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button onClick={verifyPinAndJoin} className="flex-[2] bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg shadow-indigo-200">Unlock</button>
                            </div>
                        </div>
                    )}

                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Who are you?</h2>
                    <p className="text-slate-500 font-medium">Select your name if added by the host, or create new.</p>

                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {foundTrip.members.map(m => (
                            <button
                                key={m.id}
                                onClick={() => claimMember(m.id)}
                                className={`flex items-center gap-4 bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left ${m.isCreator ? 'ring-2 ring-amber-100 bg-amber-50/30' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${m.isCreator ? 'bg-amber-100 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                    {m.isCreator ? '👑' : m.name.charAt(0)}
                                </div>
                                <div>
                                    <span className="font-bold text-slate-700 text-lg block">{m.name}</span>
                                    {m.isCreator && <span className="text-[10px] uppercase tracking-widest font-black text-amber-500">Trip Admin</span>}
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
                        <div className="relative flex justify-center"><span className="bg-slate-50 px-4 text-xs font-black text-slate-400 uppercase tracking-widest">OR</span></div>
                    </div>

                    <div className="bg-white p-6 rounded-[32px] shadow-xl border border-white">
                        <input
                            type="text"
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xl"
                            placeholder="Enter New Name"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={!guestName.trim() || isJoining}
                        onClick={handleJoinNew}
                        className="w-full bg-indigo-600 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl disabled:opacity-70"
                    >
                        {isJoining ? 'Joining...' : 'Join as New Member'}
                    </button>
                </div>
            )}
        </div>
    );
};

export default TripJoin;

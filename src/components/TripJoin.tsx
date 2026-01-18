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
        if (foundTrip) {
            onJoin(foundTrip, memberId);
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
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Who are you?</h2>
                    <p className="text-slate-500 font-medium">Select your name if added by the host, or create new.</p>

                    <div className="grid grid-cols-1 gap-3 max-h-60 overflow-y-auto custom-scrollbar">
                        {foundTrip.members.map(m => (
                            <button
                                key={m.id}
                                onClick={() => claimMember(m.id)}
                                className="flex items-center gap-4 bg-white p-5 rounded-[24px] border border-slate-50 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all text-left"
                            >
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-600">{m.name.charAt(0)}</div>
                                <span className="font-bold text-slate-700 text-lg">{m.name}</span>
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

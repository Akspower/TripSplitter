import React, { useState } from 'react';
import { IdentificationIcon, PlusIcon, TrashIcon, LockClosedIcon, SparklesIcon } from '@heroicons/react/24/outline';
import { TripService } from '../services/tripService';
import type { Trip, Member, TripStyle, BudgetType, AgeGroup } from '../types';
import { getAvatarColor } from './MemberAvatar';

const TripSetup: React.FC<{ onComplete: (trip: Trip, myId: string) => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [creatorName, setCreatorName] = useState('');
    const [formData, setFormData] = useState({ name: '', destination: '', startDate: '', endDate: '' });
    const [members, setMembers] = useState<{ id: string, name: string }[]>([]);
    const [newMember, setNewMember] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    // V3: Security & Profile
    const [adminPin, setAdminPin] = useState('');
    const [tripStyle, setTripStyle] = useState<TripStyle>('adventure');
    const [budgetType, setBudgetType] = useState<BudgetType>('moderate');
    const [ageGroup, setAgeGroup] = useState<AgeGroup>('mixed');

    // Persistence Logic
    React.useEffect(() => {
        const savedState = localStorage.getItem('trip_setup_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setStep(parsed.step || 1);
                setCreatorName(parsed.creatorName || '');
                setFormData(parsed.formData || { name: '', destination: '', startDate: '', endDate: '' });
                setMembers(parsed.members || []);
                setAdminPin(parsed.adminPin || '');
                setTripStyle(parsed.tripStyle || 'adventure');
                setBudgetType(parsed.budgetType || 'moderate');
                setAgeGroup(parsed.ageGroup || 'mixed');
            } catch (e) {
                console.error("Failed to load saved state", e);
            }
        }
    }, []);

    React.useEffect(() => {
        const state = { step, creatorName, formData, members, adminPin, tripStyle, budgetType, ageGroup };
        localStorage.setItem('trip_setup_state', JSON.stringify(state));
    }, [step, creatorName, formData, members, adminPin, tripStyle, budgetType, ageGroup]);

    const addMember = () => {
        if (newMember.trim()) {
            setMembers([...members, { id: Math.random().toString(36).substr(2, 9), name: newMember.trim() }]);
            setNewMember('');
        }
    };

    const finishSetup = async () => {
        setIsCreating(true);
        const creatorId = Math.random().toString(36).substr(2, 9);
        // Use 6-digit ID for easier sharing
        const tripId = Math.floor(100000 + Math.random() * 900000).toString();

        const allMembers: Member[] = [
            { id: creatorId, name: creatorName, isCreator: true, avatarColor: getAvatarColor(0) },
            ...members.map((m, idx) => ({ id: m.id, name: m.name, isCreator: false, avatarColor: getAvatarColor(idx + 1) }))
        ];

        const newTrip: Trip = {
            id: tripId,
            ...formData,
            members: allMembers,
            expenses: [],
            creatorId,
            adminPin: adminPin || undefined,
            tripStyle,
            budgetType,
            ageGroup
        };

        const result = await TripService.createTrip(newTrip);

        if (result.success) {
            localStorage.removeItem('trip_setup_state');
            onComplete(newTrip, creatorId);
        } else {
            alert(`Failed to create trip: ${result.error || "Unknown error"}. Please check your connection or try again.`);
        }
        setIsCreating(false);
    };

    return (
        <div className="max-w-md mx-auto p-4 sm:p-8 mt-6 w-full">
            <div className="flex justify-between gap-4 mb-16">
                {[1, 2, 3, 4].map((s) => (
                    <div key={s} className={`h-1.5 rounded-full flex-1 transition-all duration-700 ${step >= s ? 'bg-slate-900 shadow-lg' : 'bg-slate-200'}`} />
                ))}
            </div>

            {step === 1 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8">
                    <div className="flex flex-col items-center text-center">
                        <div className="bg-indigo-600 p-5 rounded-[32px] shadow-2xl shadow-indigo-200 mb-6">
                            <IdentificationIcon className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Who are you?</h2>
                        <p className="text-slate-500 font-medium">To calculate YOUR personal share, we need your name first.</p>
                    </div>
                    <div className="bg-white p-6 rounded-[32px] shadow-2xl shadow-slate-100 border border-white">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-[0.2em]">Your Identity</label>
                        <input
                            autoFocus
                            type="text"
                            className="w-full bg-slate-50 border-none rounded-2xl px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-xl"
                            placeholder="Ex: Aman"
                            value={creatorName}
                            onChange={(e) => setCreatorName(e.target.value)}
                        />
                    </div>
                    <button
                        disabled={!creatorName.trim()}
                        onClick={() => setStep(2)}
                        className="w-full bg-slate-900 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-30"
                    >
                        Start Trip Planner
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trip Blueprint 🗺️</h2>
                    <div className="space-y-4">
                        <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Adventure Title</label>
                            <input type="text" className="w-full bg-transparent border-none px-0 py-1 focus:ring-0 outline-none font-black text-2xl" placeholder="Goa Road Trip" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">The Map Says...</label>
                            <input type="text" className="w-full bg-transparent border-none px-0 py-1 focus:ring-0 outline-none font-bold text-lg" placeholder="Ex: South Goa" value={formData.destination} onChange={(e) => setFormData({ ...formData, destination: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Start</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-transparent border-none px-0 py-1 focus:ring-0 outline-none font-bold"
                                    value={formData.startDate}
                                    min={new Date().toLocaleDateString('en-CA')} // Min today (Local time)
                                    onChange={(e) => {
                                        const newStart = e.target.value;
                                        setFormData(prev => ({
                                            ...prev,
                                            startDate: newStart,
                                            // Reset end date if it's before new start date
                                            endDate: prev.endDate && prev.endDate < newStart ? '' : prev.endDate
                                        }))
                                    }}
                                />
                            </div>
                            <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">End</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full bg-transparent border-none px-0 py-1 focus:ring-0 outline-none font-bold"
                                    value={formData.endDate}
                                    min={formData.startDate || new Date().toLocaleDateString('en-CA')} // Min start date or today (Local)
                                    disabled={!formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 text-slate-500 py-5 rounded-[24px] font-bold">Back</button>
                        <button
                            disabled={!formData.name || !formData.destination || !formData.startDate || !formData.endDate}
                            onClick={() => setStep(3)}
                            className="flex-[2] bg-slate-900 text-white py-5 rounded-[24px] font-black text-xl shadow-xl"
                        >
                            Add The Squad
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">The Squad 👥</h2>
                    <div className="flex gap-3">
                        <input
                            type="text"
                            className="flex-1 bg-white border border-slate-100 rounded-[24px] px-6 py-5 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-bold"
                            placeholder="Friend's Name"
                            value={newMember}
                            onChange={(e) => setNewMember(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && addMember()}
                        />
                        <button onClick={addMember} className="bg-indigo-600 text-white p-5 rounded-[24px] shadow-lg"><PlusIcon className="w-6 h-6" /></button>
                    </div>

                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2 custom-scrollbar">
                        <div className="flex items-center gap-4 bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 shadow-sm">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center font-black text-white shadow-lg">You</div>
                            <span className="font-bold text-indigo-700 text-lg">{creatorName}</span>
                        </div>
                        {members.map(m => (
                            <div key={m.id} className="flex justify-between items-center bg-white p-6 rounded-[32px] border border-slate-50 shadow-md card-3d">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-600 text-lg">{m.name.charAt(0)}</div>
                                    <span className="font-bold text-slate-700 text-lg">{m.name}</span>
                                </div>
                                <button onClick={() => setMembers(members.filter(mem => mem.id !== m.id))} className="text-slate-300 hover:text-red-500 p-2"><TrashIcon className="w-6 h-6" /></button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-4 pt-6">
                        <button onClick={() => setStep(2)} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[24px] font-bold">Back</button>
                        <button
                            onClick={() => setStep(4)}
                            className="flex-[2] bg-slate-900 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl"
                        >
                            Trip Settings
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-8">
                    <div className="flex items-center gap-3 mb-2">
                        <SparklesIcon className="w-8 h-8 text-indigo-500" />
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">Trip Profile</h2>
                    </div>
                    <p className="text-slate-500 text-sm font-medium">Help our AI Guide give you better suggestions!</p>

                    {/* Trip Style */}
                    <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Trip Vibe</label>
                        <div className="grid grid-cols-2 gap-3">
                            {[{ v: 'adventure', l: '🏔️ Adventure', d: 'Thrills & Explore' }, { v: 'relaxed', l: '🏖️ Relaxed', d: 'Chill & Unwind' }, { v: 'budget', l: '💰 Budget', d: 'Max Value' }, { v: 'luxury', l: '✨ Luxury', d: 'Premium Experience' }].map(opt => (
                                <button key={opt.v} onClick={() => setTripStyle(opt.v as TripStyle)} className={`p-4 rounded-2xl text-left transition-all ${tripStyle === opt.v ? 'bg-indigo-600 text-white shadow-lg scale-[1.02]' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                                    <span className="font-black text-sm">{opt.l}</span>
                                    <span className="block text-[10px] opacity-70">{opt.d}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Budget Type */}
                    <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Budget Style</label>
                        <div className="flex gap-3">
                            {[{ v: 'backpacker', l: '🎒 Backpacker' }, { v: 'moderate', l: '⚖️ Moderate' }, { v: 'splurge', l: '💎 Splurge' }].map(opt => (
                                <button key={opt.v} onClick={() => setBudgetType(opt.v as BudgetType)} className={`flex-1 py-4 px-3 rounded-2xl font-black text-sm transition-all ${budgetType === opt.v ? 'bg-emerald-500 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Age Group */}
                    <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                        <label className="block text-[10px] font-black text-slate-400 uppercase mb-3 tracking-widest">Squad Type</label>
                        <div className="flex gap-3">
                            {[{ v: 'youth', l: '🎉 Youth' }, { v: 'mixed', l: '👥 Mixed' }, { v: 'family', l: '👨‍👩‍👧 Family' }, { v: 'seniors', l: '🌅 Seniors' }].map(opt => (
                                <button key={opt.v} onClick={() => setAgeGroup(opt.v as AgeGroup)} className={`flex-1 py-4 px-2 rounded-2xl font-black text-xs transition-all ${ageGroup === opt.v ? 'bg-amber-500 text-white shadow-lg' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>
                                    {opt.l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Admin PIN */}
                    <div className="bg-slate-900 p-6 rounded-[28px] shadow-xl">
                        <div className="flex items-center gap-3 mb-3">
                            <LockClosedIcon className="w-5 h-5 text-indigo-400" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin PIN (Optional)</label>
                        </div>
                        <input
                            type="password"
                            maxLength={4}
                            className="w-full bg-slate-800 border-none rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none font-black text-2xl text-white text-center tracking-[0.5em]"
                            placeholder="••••"
                            value={adminPin}
                            onChange={(e) => setAdminPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        />
                        <p className="text-slate-500 text-xs mt-2 text-center">4-digit PIN to protect trip deletion</p>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button onClick={() => setStep(3)} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-[24px] font-bold">Back</button>
                        <button
                            disabled={isCreating}
                            onClick={finishSetup}
                            className="flex-[2] bg-indigo-600 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl disabled:opacity-70 disabled:animate-pulse"
                        >
                            {isCreating ? 'Creating...' : '🚀 Launch Trip'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripSetup;

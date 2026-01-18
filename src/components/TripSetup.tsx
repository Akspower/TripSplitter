import React, { useState } from 'react';
import { IdentificationIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import { TripService } from '../services/tripService';
import type { Trip, Member } from '../types';

const TripSetup: React.FC<{ onComplete: (trip: Trip, myId: string) => void }> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [creatorName, setCreatorName] = useState('');
    const [formData, setFormData] = useState({ name: '', destination: '', startDate: '', endDate: '' });
    const [members, setMembers] = useState<{ id: string, name: string }[]>([]);
    const [newMember, setNewMember] = useState('');
    const [isCreating, setIsCreating] = useState(false);

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
            { id: creatorId, name: creatorName, isCreator: true },
            ...members.map(m => ({ id: m.id, name: m.name, isCreator: false }))
        ];

        const newTrip: Trip = {
            id: tripId,
            ...formData,
            members: allMembers,
            expenses: [],
            creatorId
        };

        const result = await TripService.createTrip(newTrip);

        if (result.success) {
            onComplete(newTrip, creatorId);
        } else {
            alert(`Failed to create trip: ${result.error || "Unknown error"}. Please check your connection or try again.`);
        }
        setIsCreating(false);
    };

    return (
        <div className="max-w-md mx-auto p-4 sm:p-8 mt-6 w-full">
            <div className="flex justify-between gap-4 mb-16">
                {[1, 2, 3].map((s) => (
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
                                <input type="date" required className="w-full bg-transparent border-none px-0 py-1 focus:ring-0 outline-none font-bold" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} />
                            </div>
                            <div className="bg-white p-6 rounded-[28px] shadow-xl border border-slate-50">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">End</label>
                                <input type="date" required className="w-full bg-transparent border-none px-0 py-1 focus:ring-0 outline-none font-bold" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} />
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
                            disabled={isCreating}
                            onClick={finishSetup}
                            className="flex-[2] bg-indigo-600 text-white py-6 rounded-[24px] font-black text-xl shadow-2xl disabled:opacity-70 disabled:animate-pulse"
                        >
                            {isCreating ? 'Creating...' : 'Start Adventure'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TripSetup;

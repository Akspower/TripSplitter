import React, { useState } from 'react';
import { CurrencyRupeeIcon, MapPinIcon, TrashIcon, CalendarDaysIcon, ArrowLeftOnRectangleIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    tripName?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    onReset: () => void;
    onDelete?: () => void;
    isSyncing?: boolean;
    isOffline?: boolean;
    isCreator?: boolean;
    tripId?: string;
}

const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-IN', opts)} - ${e.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
};

const Header: React.FC<HeaderProps> = ({ tripName, destination, startDate, endDate, onReset, onDelete, isSyncing, isOffline, isCreator, tripId }) => {
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    return (
        <>
            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-sm rounded-[32px] p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                                <ArrowLeftOnRectangleIcon className="w-8 h-8 text-slate-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">Leave Trip?</h3>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                You can rejoin later using the Room ID. Your expenses will be saved safely!
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="py-4 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
                                >
                                    Stay
                                </button>
                                <button
                                    onClick={onReset}
                                    className="py-4 rounded-2xl font-black bg-rose-500 text-white shadow-lg shadow-rose-200 hover:bg-rose-600 transition-colors"
                                >
                                    Exit Trip
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <header className="sticky top-0 z-50 glass border-b border-slate-200/50 px-3 md:px-6 py-3 flex justify-between items-center bg-white/80 backdrop-blur-md">
                <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
                    <div className="bg-slate-900 p-2 rounded-xl md:rounded-2xl shadow-lg shrink-0">
                        <CurrencyRupeeIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight truncate hidden xs:block">SplitWay</h1>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full sync-dot ${isOffline ? 'bg-rose-500' : (isSyncing ? 'bg-orange-400' : 'bg-emerald-500')}`}></div>
                            <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest truncate ${isOffline ? 'text-rose-500' : 'text-slate-400'}`}>
                                {isOffline ? 'Offline' : (isSyncing ? 'Syncing...' : 'Realtime')}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Responsive Trip Info Pill */}
                    {(destination || tripName) && (
                        <div className="flex flex-col items-end mr-1">
                            <div className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full border border-indigo-100 flex items-center gap-1.5 uppercase tracking-widest max-w-[140px] truncate">
                                <MapPinIcon className="w-3 h-3 shrink-0" />
                                <span className="truncate">{destination || tripName}</span>
                            </div>
                            {startDate && endDate && (
                                <div className="text-[9px] font-bold text-slate-400 mt-1 flex items-center gap-1 px-1">
                                    <CalendarDaysIcon className="w-3 h-3" />
                                    <span>{formatDateRange(startDate, endDate)}</span>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        onClick={() => {
                            if (!tripId) return;
                            const shareUrl = `${window.location.origin}/?join=${tripId}`;
                            const shareData = {
                                title: 'Join my trip on SplitWay',
                                text: `Join ${tripName || 'my trip'} on SplitWay! Room Code: ${tripId}`,
                                url: shareUrl
                            };

                            if (navigator.share) {
                                navigator.share(shareData).catch(console.error);
                            } else {
                                navigator.clipboard.writeText(shareData.text + " " + shareData.url);
                                alert("Link copied to clipboard!");
                            }
                        }}
                        className={tripId ? "p-2 text-indigo-400 hover:text-indigo-600 font-bold transition-colors" : "hidden"}
                        title="Share Trip Invite"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.287.696.287 1.093s-.107.77-.287 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.935-2.186 2.25 2.25 0 00-3.935 2.186z" />
                        </svg>
                    </button>

                    {tripId && (
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            className="p-2 text-slate-400 hover:text-slate-900 font-bold text-[10px] md:text-xs uppercase tracking-widest bg-slate-50 rounded-lg md:bg-transparent md:p-2"
                        >
                            Exit
                        </button>
                    )}

                    {isCreator && onDelete && (
                        <button onClick={onDelete} className="p-2 text-rose-300 hover:text-rose-600 font-bold transition-colors" title="Delete Trip">
                            <TrashIcon className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </header>
        </>
    );
};

export default Header;

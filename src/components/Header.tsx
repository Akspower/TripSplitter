import React from 'react';
import { CurrencyRupeeIcon, MapPinIcon, TrashIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

interface HeaderProps {
    tripName?: string;
    destination?: string;
    startDate?: string;
    endDate?: string;
    onReset: () => void;
    onDelete?: () => void;
    isSyncing?: boolean;
    isCreator?: boolean;
}

const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-IN', opts)} - ${e.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
};

const Header: React.FC<HeaderProps> = ({ tripName, destination, startDate, endDate, onReset, onDelete, isSyncing, isCreator }) => (
    <header className="sticky top-0 z-50 glass border-b border-slate-200/50 px-4 md:px-6 py-4 flex justify-between items-center bg-white/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
            <div className="bg-slate-900 p-2.5 rounded-2xl shadow-xl transition-all duration-500">
                <CurrencyRupeeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight hidden sm:block">SplitWay</h1>
                <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full sync-dot ${isSyncing ? 'bg-orange-400' : 'bg-emerald-500'}`}></div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {isSyncing ? 'Syncing...' : 'Realtime Hub'}
                    </span>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
            {/* Trip Name & Destination */}
            {tripName && (
                <div className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-3 sm:px-4 py-2 rounded-full border border-indigo-100 flex items-center gap-2 uppercase tracking-widest max-w-[120px] sm:max-w-[180px] truncate">
                    <MapPinIcon className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{destination || tripName}</span>
                </div>
            )}
            {/* Dates */}
            {startDate && endDate && (
                <div className="hidden md:flex text-[10px] font-black bg-emerald-50 text-emerald-600 px-4 py-2 rounded-full border border-emerald-100 items-center gap-2 uppercase tracking-widest">
                    <CalendarDaysIcon className="w-3.5 h-3.5 shrink-0" />
                    <span>{formatDateRange(startDate, endDate)}</span>
                </div>
            )}
            <button onClick={onReset} className="p-2 text-slate-400 hover:text-slate-900 font-bold text-xs uppercase tracking-widest">
                Exit
            </button>
            {isCreator && onDelete && (
                <button onClick={onDelete} className="p-2 text-rose-300 hover:text-rose-600 font-bold transition-colors" title="Delete Trip">
                    <TrashIcon className="w-5 h-5" />
                </button>
            )}
        </div>
    </header>
);

export default Header;

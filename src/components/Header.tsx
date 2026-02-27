import React, { useState } from 'react';

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
    userName?: string;
    showLogout?: boolean;
    onExportPDF?: () => void;
}

const formatDateRange = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const s = new Date(start);
    const e = new Date(end);
    const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return `${s.toLocaleDateString('en-IN', opts)} – ${e.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
};

const Header: React.FC<HeaderProps> = ({ tripName, destination, startDate, endDate, onReset, onDelete, isSyncing, isOffline, isCreator, tripId, showLogout, onExportPDF }) => {
    const [showExitConfirm, setShowExitConfirm] = useState(false);

    const syncColor = isOffline ? 'bg-rose-500' : isSyncing ? 'bg-orange-400' : 'bg-emerald-500';
    const syncLabel = isOffline ? 'Offline' : isSyncing ? 'Syncing...' : 'Realtime';

    return (
        <>
            {/* Logout Confirmation Modal */}
            {showExitConfirm && (
                <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="glass-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-white/10">
                        <div className="text-center space-y-4">
                            <div className="w-14 h-14 glass-pill rounded-full flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-[rgba(244,244,248,0.6)] text-3xl">logout</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#F4F4F8] tracking-tight">Leave Trip?</h3>
                            <p className="text-[rgba(244,244,248,0.5)] text-sm font-medium leading-relaxed">
                                You can rejoin anytime using the Room ID. Your data stays safe.
                            </p>
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={() => setShowExitConfirm(false)}
                                    className="py-3.5 rounded-2xl font-bold text-[rgba(244,244,248,0.5)] glass-pill border border-white/10 text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onReset}
                                    className="py-3.5 rounded-2xl font-bold bg-[#b613ec] text-white text-sm shadow-lg shadow-[#b613ec]/30"
                                >
                                    Leave
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Header */}
            <header className="sticky top-0 z-50 glass-header px-4 md:px-6 py-3 flex justify-between items-center">
                {/* Left: Logo + Sync Status */}
                <div className="flex items-center gap-2.5 overflow-hidden">
                    <div className="bg-[#b613ec] p-1.5 rounded-xl flex items-center justify-center shadow-lg shadow-[#b613ec]/30 shrink-0">
                        <span className="material-symbols-outlined text-white text-xl">account_balance_wallet</span>
                    </div>
                    <div className="min-w-0">
                        <h1 className="text-base font-bold text-[#F4F4F8] tracking-tight truncate">SplitWay</h1>
                        <div className="flex items-center gap-1.5">
                            <div className={`w-1.5 h-1.5 rounded-full sync-dot ${syncColor}`} />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-[rgba(244,244,248,0.4)]">{syncLabel}</span>
                        </div>
                    </div>
                </div>

                {/* Right: Trip Info + Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Trip destination pill */}
                    {(destination || tripName) && (
                        <div className="hidden sm:flex flex-col items-end mr-1">
                            <div className="text-[10px] font-bold glass-pill text-[#b613ec] px-3 py-1.5 rounded-full border border-[#b613ec]/30 flex items-center gap-1.5 uppercase tracking-widest max-w-[140px] truncate">
                                <span className="material-symbols-outlined text-xs">location_on</span>
                                <span className="truncate">{destination || tripName}</span>
                            </div>
                            {startDate && endDate && (
                                <div className="text-[9px] font-bold text-[rgba(244,244,248,0.3)] mt-1 px-1">
                                    {formatDateRange(startDate, endDate)}
                                </div>
                            )}
                        </div>
                    )}

                    {/* PDF Export */}
                    {onExportPDF && tripId && (
                        <button
                            onClick={onExportPDF}
                            className="flex items-center gap-1.5 px-3 py-2 glass-pill text-emerald-400 text-[10px] font-bold rounded-full uppercase tracking-widest border border-emerald-400/20 transition-all hover:bg-emerald-400/10"
                            title="Download Trip Report"
                        >
                            <span className="material-symbols-outlined text-sm">download</span>
                            <span className="hidden sm:inline">Report</span>
                        </button>
                    )}

                    {/* Share */}
                    {tripId && (
                        <button
                            onClick={() => {
                                const shareUrl = `${window.location.origin}/?join=${tripId}`;
                                const shareData = { title: 'Join my trip on SplitWay', text: `Join my trip on SplitWay! Room: ${tripId}`, url: shareUrl };
                                if (navigator.share) {
                                    navigator.share(shareData).catch(console.error);
                                } else {
                                    navigator.clipboard.writeText(shareData.text + " " + shareData.url);
                                }
                            }}
                            className="w-9 h-9 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.5)] hover:text-[#b613ec] transition-colors"
                            title="Share Trip"
                        >
                            <span className="material-symbols-outlined text-lg">share</span>
                        </button>
                    )}

                    {/* Logout */}
                    {(tripId || showLogout) && (
                        <button
                            onClick={() => setShowExitConfirm(true)}
                            className="w-9 h-9 glass-pill rounded-full flex items-center justify-center text-[rgba(244,244,248,0.4)] hover:text-[#F4F4F8] transition-colors"
                            title="Leave Trip"
                        >
                            <span className="material-symbols-outlined text-lg">logout</span>
                        </button>
                    )}

                    {/* Delete Trip (Creator only) */}
                    {isCreator && onDelete && (
                        <button
                            onClick={onDelete}
                            className="w-9 h-9 glass-pill rounded-full flex items-center justify-center text-rose-400/60 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                            title="Delete Trip"
                        >
                            <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                    )}
                </div>
            </header>
        </>
    );
};

export default Header;

import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR } from '../utils/formatters';
import type { Trip } from '../types';

interface AnalyticsProps {
    trip: Trip;
    myId: string;
    onExportPDF?: () => void;
}

const CATEGORY_EMOJI: Record<string, string> = {
    Food: '🍛', Drink: '🥤', Alcohol: '🍺', 'Cab/Taxi': '🚕',
    'Train/Bus/Flight': '✈️', 'Hotel/Stay': '🏨', 'Trekking Gear': '🥾',
    'Entry Fee': '🎟️', Shopping: '🛍️', Other: '📍',
};

const CHART_COLORS = ['#b613ec', '#6366F1', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#F43F5E', '#84CC16'];
const MEMBER_GRADIENTS = [
    'from-violet-500 to-[#b613ec]', 'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600', 'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-600', 'from-cyan-400 to-blue-500',
];

const InitialAvatar: React.FC<{ name: string; index: number; size?: string }> = ({ name, index, size = 'w-12 h-12' }) => (
    <div className={`${size} rounded-2xl bg-gradient-to-br ${MEMBER_GRADIENTS[index % MEMBER_GRADIENTS.length]} flex items-center justify-center font-bold text-white shrink-0`}>
        {name.charAt(0).toUpperCase()}
    </div>
);

const Analytics: React.FC<AnalyticsProps> = ({ trip, myId, onExportPDF }) => {
    const categoryData = useMemo(() => {
        const stats: Record<string, number> = {};
        trip.expenses.forEach(e => { stats[e.category] = (stats[e.category] || 0) + e.amount; });
        return Object.entries(stats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    }, [trip.expenses]);

    const memberData = useMemo(() => {
        const stats: Record<string, number> = {};
        trip.expenses.forEach(e => { stats[e.payerId] = (stats[e.payerId] || 0) + e.amount; });
        return Object.entries(stats).map(([id, value]) => ({
            name: trip.members.find(m => m.id === id)?.name || 'Unknown',
            value, id,
            index: trip.members.findIndex(m => m.id === id)
        })).sort((a, b) => b.value - a.value);
    }, [trip.expenses, trip.members]);

    const totalSpent = trip.expenses.reduce((s, e) => s + e.amount, 0);
    const myShare = trip.expenses.reduce((s, e) => {
        if (e.splitType === 'EXACT' && e.splitDetails) return s + (e.splitDetails[myId] || 0);
        if (e.participantIds.includes(myId)) return s + e.amount / e.participantIds.length;
        return s;
    }, 0);

    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);
    const dailyAvg = totalSpent / durationDays;

    const topSpender = memberData[0];
    const mostFreqPayer = useMemo(() => {
        const freq: Record<string, number> = {};
        trip.expenses.forEach(e => { freq[e.payerId] = (freq[e.payerId] || 0) + 1; });
        const topId = Object.entries(freq).sort((a, b) => b[1] - a[1])[0];
        return topId ? { id: topId[0], count: topId[1], name: trip.members.find(m => m.id === topId[0])?.name || '?', index: trip.members.findIndex(m => m.id === topId[0]) } : null;
    }, [trip.expenses, trip.members]);

    // AI Smart insight
    const topCategory = categoryData[0];
    const topCategoryPct = topCategory ? Math.round((topCategory.value / (totalSpent || 1)) * 100) : 0;
    const mySharePct = Math.round((myShare / (totalSpent || 1)) * 100);
    const perDayGroup = totalSpent / durationDays;       // total group spend per day
    const perDayPerPerson = perDayGroup / Math.max(1, trip.members.length); // per person per day
    const perDayMyShare = myShare / durationDays;        // my personal daily average

    // Trip forecast: days elapsed vs total duration, project my share at current burn rate
    const today = new Date();
    const tripStart = new Date(trip.startDate);
    const daysElapsed = Math.max(1, Math.ceil((today.getTime() - tripStart.getTime()) / (1000 * 3600 * 24)));
    const projectedMyTotal = daysElapsed > 0 ? (myShare / daysElapsed) * durationDays : myShare;

    const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
        if (active && payload?.length) {
            return (
                <div className="bg-[#0d0817]/95 border border-[#b613ec]/30 p-3 rounded-2xl shadow-xl text-xs backdrop-blur-md">
                    <p className="font-bold text-[#F4F4F8] mb-1">{payload[0].name}</p>
                    <p className="text-[#b613ec] font-bold text-base">{formatINR(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    if (trip.expenses.length === 0) {
        return (
            <div className="glass-card rounded-3xl p-16 text-center border-2 border-dashed border-white/10 flex flex-col items-center gap-4">
                <div className="w-20 h-20 bg-[#b613ec]/10 rounded-3xl flex items-center justify-center border border-[#b613ec]/20">
                    <span className="material-symbols-outlined text-[#b613ec] text-4xl">bar_chart</span>
                </div>
                <p className="text-[rgba(244,244,248,0.4)] font-bold text-base">Add expenses to see analytics</p>
                <p className="text-[rgba(244,244,248,0.2)] text-sm">Your spending insights will appear here</p>
            </div>
        );
    }

    return (
        <div className="space-y-5">
            {/* ── Smart Summary Card ── */}
            <div className="glass-card rounded-2xl p-6 relative overflow-hidden border border-white/8">
                <div className="absolute top-0 right-0 opacity-10 p-2">
                    <span className="material-symbols-outlined text-[80px] text-[#b613ec]">analytics</span>
                </div>
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">✨</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#b613ec]/80">Smart Summary</span>
                </div>
                <h2 className="text-2xl font-bold leading-tight mb-2 text-[#F4F4F8]">
                    <span className="text-[#b613ec]">{topCategory?.name || 'Food'}</span> is your biggest spend.
                </h2>
                <p className="text-[rgba(244,244,248,0.45)] text-sm">
                    {topCategoryPct}% of total trip budget ({formatINR(topCategory?.value || 0)}) went to this category.
                    Your personal share is {mySharePct}% of the group total.
                </p>
            </div>

            {/* ── AI Tip Pill ── */}
            <div className="bg-[#b613ec]/10 border border-[#b613ec]/20 rounded-full py-3 px-5 flex items-center gap-3">
                <span className="text-xl shrink-0">💡</span>
                <p className="text-sm font-medium text-[rgba(244,244,248,0.8)]">
                    Group spends ~{formatINR(perDayPerPerson)}/person/day. Your personal burn rate is {formatINR(perDayMyShare)}/day.
                </p>
            </div>

            {/* ── Key Metrics ── */}
            <div className="grid grid-cols-3 gap-3">
                <div className="glass-card rounded-2xl p-4 border border-white/8 relative overflow-hidden">
                    <div className="absolute -top-4 -right-4 w-16 h-16 bg-[#b613ec]/20 rounded-full blur-xl" />
                    <div className="relative z-10">
                        <span className="material-symbols-outlined text-[#b613ec] text-lg">payments</span>
                        <p className="text-lg font-bold text-[#F4F4F8] mt-1 leading-tight">{formatINR(totalSpent)}</p>
                        <p className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold uppercase tracking-widest mt-1">Total</p>
                    </div>
                </div>
                <div className="glass-card rounded-2xl p-4 border border-white/8">
                    <span className="material-symbols-outlined text-rose-400 text-lg">person</span>
                    <p className="text-lg font-bold text-[#F4F4F8] mt-1 leading-tight">{formatINR(myShare)}</p>
                    <p className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold uppercase tracking-widest mt-1">My Share</p>
                </div>
                <div className="glass-card rounded-2xl p-4 border border-white/8">
                    <span className="material-symbols-outlined text-amber-400 text-lg">calendar_today</span>
                    <p className="text-lg font-bold text-[#F4F4F8] mt-1 leading-tight">{formatINR(dailyAvg)}</p>
                    <p className="text-[rgba(244,244,248,0.35)] text-[10px] font-bold uppercase tracking-widest mt-1">/Day</p>
                </div>
            </div>

            {/* ── Spending by Category + Donut ── */}
            <section>
                <h3 className="text-base font-bold text-[#F4F4F8] mb-4 px-1">Spending by Category</h3>
                <div className="glass-card rounded-2xl p-6 border border-white/8 flex flex-col items-center">
                    <div className="relative w-48 h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={56} outerRadius={90}
                                    paddingAngle={4} dataKey="value" stroke="none">
                                    {categoryData.map((_, index) => (
                                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <p className="text-2xl font-bold text-[#F4F4F8]">{formatINR(totalSpent)}</p>
                            <p className="text-[9px] uppercase text-[rgba(244,244,248,0.4)] tracking-widest font-bold">Total Spent</p>
                        </div>
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap gap-2 mt-6 justify-center">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 glass-pill px-3 py-1.5 rounded-full">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} />
                                <span className="text-[10px] font-bold text-[rgba(244,244,248,0.5)] uppercase">{entry.name}</span>
                                <span className="text-[10px] font-bold text-[#F4F4F8]">{Math.round((entry.value / totalSpent) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Group Dynamics ── */}
            <section>
                <h3 className="text-base font-bold text-[#F4F4F8] mb-4 px-1">Trip MVPs</h3>
                <div className="grid grid-cols-2 gap-4">
                    {/* Biggest Spender */}
                    <div className="glass-card rounded-2xl p-5 border border-white/8 flex flex-col items-center text-center gap-3">
                        <div className="ring-2 ring-[#b613ec] ring-offset-2 ring-offset-[#0A0A0F] rounded-2xl">
                            <InitialAvatar name={topSpender?.name || '?'} index={topSpender?.index || 0} size="w-16 h-16" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[#b613ec] block mb-1">Biggest Spender</span>
                            <p className="font-bold text-[#F4F4F8] text-base leading-tight">{topSpender?.name || 'N/A'}</p>
                            <p className="text-[rgba(244,244,248,0.4)] text-xs mt-1">{topSpender ? formatINR(topSpender.value) : '—'}</p>
                        </div>
                    </div>
                    {/* Most Frequent Payer */}
                    <div className="glass-card rounded-2xl p-5 border border-white/8 flex flex-col items-center text-center gap-3">
                        <div className="ring-2 ring-cyan-400 ring-offset-2 ring-offset-[#0A0A0F] rounded-2xl">
                            <InitialAvatar name={mostFreqPayer?.name || '?'} index={mostFreqPayer?.index || 1} size="w-16 h-16" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-400 block mb-1">Most Frequent</span>
                            <p className="font-bold text-[#F4F4F8] text-base leading-tight">{mostFreqPayer?.name || 'N/A'}</p>
                            <p className="text-[rgba(244,244,248,0.4)] text-xs mt-1">{mostFreqPayer ? `${mostFreqPayer.count} Payments` : '—'}</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Top Spenders Bar List ── */}
            <section>
                <div className="glass-card rounded-2xl p-5 border border-white/8">
                    <h3 className="text-base font-bold text-[#F4F4F8] mb-5 flex items-center gap-2">
                        <span className="text-lg">📊</span>
                        Who Paid the Most
                    </h3>
                    <div className="space-y-4">
                        {memberData.map((member, index) => {
                            // Medal emoji — renders natively on every mobile OS, no font dependency
                            const medals = ['🥇', '🥈', '🥉'];
                            const medal = index < 3 ? medals[index] : null;
                            return (
                                <div key={member.id}>
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <InitialAvatar name={member.name} index={member.index} size="w-9 h-9" />
                                                {medal && (
                                                    <span className="absolute -top-2 -right-2 text-base leading-none select-none">{medal}</span>
                                                )}
                                            </div>
                                            <p className={`text-sm font-bold leading-tight ${member.id === myId ? 'text-[#b613ec]' : 'text-[#F4F4F8]'}`}>
                                                {member.name}{member.id === myId ? ' (You)' : ''}
                                            </p>
                                        </div>
                                        <span className="font-bold text-[#F4F4F8] text-sm shrink-0 ml-2">{formatINR(member.value)}</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full ${index === 0 ? 'bg-gradient-to-r from-amber-400 to-yellow-300'
                                                    : index === 1 ? 'bg-gradient-to-r from-slate-300 to-slate-400'
                                                        : index === 2 ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                                                            : member.id === myId ? 'bg-gradient-to-r from-violet-500 to-[#b613ec]'
                                                                : `bg-gradient-to-r ${MEMBER_GRADIENTS[index % MEMBER_GRADIENTS.length]}`
                                                }`}
                                            style={{ width: `${(member.value / (memberData[0]?.value || 1)) * 100}%`, transition: 'width 1s ease' }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* ── Category Detail ── */}
            <section>
                <div className="glass-card rounded-2xl p-5 border border-white/8">
                    <h3 className="text-base font-bold text-[#F4F4F8] mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-indigo-400">category</span>
                        Category Breakdown
                    </h3>
                    <div className="space-y-3">
                        {categoryData.map((cat, index) => (
                            <div key={index} className="flex items-center gap-4 p-3.5 bg-white/5 rounded-xl border border-white/5">
                                <span className="text-2xl w-8 text-center shrink-0">{CATEGORY_EMOJI[cat.name] || '📍'}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between mb-1.5">
                                        <p className="text-sm font-bold text-[#F4F4F8]">{cat.name}</p>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#F4F4F8] text-sm">{formatINR(cat.value)}</span>
                                            <span className="text-[rgba(244,244,248,0.3)] text-[10px] font-bold">{Math.round((cat.value / totalSpent) * 100)}%</span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div style={{ width: `${(cat.value / (categoryData[0]?.value || 1)) * 100}%`, background: CHART_COLORS[index % CHART_COLORS.length], transition: 'width 1s ease' }}
                                            className="h-full rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Trip Forecast ── */}
            <section>
                <div className="glass-card rounded-2xl p-5 border-l-4 border-[#b613ec] border-r border-t border-b border-white/8">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="font-bold text-lg text-[#F4F4F8]">My Trip Forecast</h3>
                            <p className="text-xs text-[rgba(244,244,248,0.4)]">Projected total if spending continues at current pace</p>
                        </div>
                        <span className="material-symbols-outlined text-[#b613ec]">trending_up</span>
                    </div>
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-3xl font-bold tracking-tight text-[#F4F4F8]">{formatINR(projectedMyTotal)}</p>
                            <p className="text-[10px] text-[#b613ec] font-bold uppercase tracking-widest mt-1">
                                Projected End-of-Trip for You
                            </p>
                            {projectedMyTotal > myShare && (
                                <p className="text-[10px] text-amber-400 mt-1">
                                    ⚠️ {formatINR(projectedMyTotal - myShare)} more expected if pace holds
                                </p>
                            )}
                        </div>
                        {onExportPDF && (
                            <button onClick={onExportPDF}
                                className="flex items-center gap-1.5 bg-[#b613ec] text-white text-xs font-bold py-2.5 px-4 rounded-full shadow-lg shadow-[#b613ec]/30">
                                <span className="material-symbols-outlined text-sm">download</span>
                                PDF
                            </button>
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Analytics;

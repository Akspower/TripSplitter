import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { formatINR } from '../utils/formatters';
import type { Trip } from '../types';
import { ArrowTrendingUpIcon, BanknotesIcon, CalendarIcon } from '@heroicons/react/24/outline';

interface AnalyticsProps {
    trip: Trip;
    myId: string;
}

const COLORS = [
    '#6366F1', // Indigo
    '#EC4899', // Pink
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#8B5CF6', // Violet
    '#06B6D4', // Cyan
    '#F43F5E', // Rose
    '#84CC16', // Lime
];

const Analytics: React.FC<AnalyticsProps> = ({ trip, myId }) => {

    // 1. Category Data
    const categoryData = useMemo(() => {
        const stats: Record<string, number> = {};
        trip.expenses.forEach(e => {
            stats[e.category] = (stats[e.category] || 0) + e.amount;
        });
        return Object.entries(stats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [trip.expenses]);

    // 2. Member Spending
    const memberData = useMemo(() => {
        const stats: Record<string, number> = {};
        trip.expenses.forEach(e => {
            stats[e.payerId] = (stats[e.payerId] || 0) + e.amount;
        });
        return Object.entries(stats)
            .map(([id, value]) => ({
                name: trip.members.find(m => m.id === id)?.name || 'Unknown',
                value,
                id
            }))
            .sort((a, b) => b.value - a.value);
    }, [trip.expenses, trip.members]);

    // 3. Key Metrics
    const totalSpent = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
    const myShare = trip.expenses
        .filter(e => e.participantIds.includes(myId))
        .reduce((sum, e) => sum + (e.amount / e.participantIds.length), 0);

    // Duration Logic
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    const durationDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24)) + 1);
    const dailyAvg = totalSpent / durationDays;

    // Custom Tooltip for Charts
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900/90 backdrop-blur-md text-white p-3 rounded-xl shadow-xl border border-white/10 text-xs">
                    <p className="font-bold mb-1">{payload[0].name}</p>
                    <p className="text-emerald-400 font-black text-lg">{formatINR(payload[0].value)}</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Hero Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Total Spent */}
                <div className="bg-slate-900 text-white p-6 rounded-[32px] relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 p-32 bg-indigo-500 rounded-full blur-[80px] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2 text-indigo-300">
                            <BanknotesIcon className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">Total Trip Cost</span>
                        </div>
                        <h2 className="text-4xl font-black tracking-tight">{formatINR(totalSpent)}</h2>
                        <p className="text-slate-400 text-xs font-bold mt-2">Across {trip.expenses.length} expenses</p>
                    </div>
                </div>

                {/* My Share */}
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-lg relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-2 text-rose-500">
                        <ArrowTrendingUpIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Your Share</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">{formatINR(myShare)}</h2>
                    <p className="text-slate-400 text-xs font-bold mt-2">
                        {((myShare / (totalSpent || 1)) * 100).toFixed(1)}% of total
                    </p>
                </div>

                {/* Daily Average */}
                <div className="bg-indigo-50 p-6 rounded-[32px] border border-indigo-100 shadow-lg sm:col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-3 mb-2 text-indigo-600">
                        <CalendarIcon className="w-5 h-5" />
                        <span className="text-xs font-black uppercase tracking-widest">Daily Average</span>
                    </div>
                    <h2 className="text-4xl font-black tracking-tight text-slate-900">{formatINR(dailyAvg)}</h2>
                    <p className="text-slate-400 text-xs font-bold mt-2">For {durationDays} days</p>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Category Donut Chart */}
                <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <span className="bg-indigo-100 text-indigo-600 p-2 rounded-xl text-sm">📊</span> Spending Breakdown
                    </h3>
                    <div className="h-[300px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {categoryData.map((_, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                        {/* Center Text */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-center">
                                <span className="block text-3xl font-black text-slate-900">{categoryData.length}</span>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Categories</span>
                            </div>
                        </div>
                    </div>
                    {/* Compact Legend */}
                    <div className="flex flex-wrap gap-2 justify-center mt-4">
                        {categoryData.map((entry, index) => (
                            <div key={index} className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                <span className="text-[10px] font-bold text-slate-600 uppercase">{entry.name}</span>
                                <span className="text-[10px] font-black text-slate-900">{Math.round((entry.value / totalSpent) * 100)}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Member Spending Bar Chart */}
                <div className="bg-white p-6 sm:p-8 rounded-[40px] shadow-xl shadow-slate-200/50 border border-slate-100 flex flex-col">
                    <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                        <span className="bg-rose-100 text-rose-600 p-2 rounded-xl text-sm">🏆</span> Top Spenders
                    </h3>

                    <div className="space-y-4 flex-1 overflow-y-auto pr-2 max-h-[350px]">
                        {memberData.map((member, index) => (
                            <div key={member.id} className="relative group">
                                <div className="flex items-end justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${member.id === myId ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500'}`}>
                                            {index + 1}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-bold ${member.id === myId ? 'text-indigo-600' : 'text-slate-900'}`}>
                                                {member.name} {member.id === myId && '(You)'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-lg text-slate-900">{formatINR(member.value)}</p>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${member.id === myId ? 'bg-indigo-500' : 'bg-slate-400'}`}
                                        style={{ width: `${(member.value / (memberData[0]?.value || 1)) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;

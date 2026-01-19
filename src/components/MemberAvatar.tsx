import React from 'react';

// 12 vibrant, distinguishable avatar colors
const AVATAR_COLORS = [
    'bg-rose-500',
    'bg-orange-500',
    'bg-amber-500',
    'bg-emerald-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-blue-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-red-500'
];

// Get a consistent color based on member index or ID
export const getAvatarColor = (index: number): string => {
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
};

interface MemberAvatarProps {
    name: string;
    index: number;
    size?: 'sm' | 'md' | 'lg';
    isYou?: boolean;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl'
};

const MemberAvatar: React.FC<MemberAvatarProps> = ({ name, index, size = 'md', isYou = false }) => {
    const colorClass = isYou ? 'bg-indigo-600' : getAvatarColor(index);
    const initial = name.charAt(0).toUpperCase();

    return (
        <div
            className={`${sizeClasses[size]} ${colorClass} rounded-2xl flex items-center justify-center font-black text-white shadow-lg`}
            title={name}
        >
            {isYou ? '👤' : initial}
        </div>
    );
};

export default MemberAvatar;

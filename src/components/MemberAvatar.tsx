import React from 'react';

const GRADIENTS = [
    'from-violet-500 to-[#b613ec]',
    'from-emerald-400 to-teal-600',
    'from-rose-400 to-pink-600',
    'from-amber-400 to-orange-500',
    'from-blue-400 to-indigo-600',
    'from-cyan-400 to-blue-500',
    'from-yellow-400 to-orange-500',
    'from-pink-400 to-rose-600',
    'from-purple-400 to-violet-600',
    'from-teal-400 to-emerald-600',
    'from-red-400 to-rose-600',
    'from-sky-400 to-blue-600',
];

export const getAvatarColor = (index: number): string => {
    // Return a simple bg class for backward compat
    const classes = ['bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 'bg-blue-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-pink-500', 'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-sky-500'];
    return classes[index % classes.length];
};

interface MemberAvatarProps {
    name: string;
    index: number;
    size?: 'sm' | 'md' | 'lg';
    isYou?: boolean;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-xl',
};

const radii = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
};

const MemberAvatar: React.FC<MemberAvatarProps> = ({ name, index, size = 'md', isYou = false }) => {
    const gradient = isYou ? 'from-violet-500 to-[#b613ec]' : GRADIENTS[index % GRADIENTS.length];
    const initial = name.charAt(0).toUpperCase();

    return (
        <div
            className={`${sizeClasses[size]} ${radii[size]} bg-gradient-to-br ${gradient} flex items-center justify-center font-bold text-white shadow-md shrink-0`}
            title={name}
        >
            {initial}
        </div>
    );
};

export default MemberAvatar;

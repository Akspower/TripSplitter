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

// Unique avatar emojis — travel & nature themed, no gender, completely unique per slot
// Deterministic by index so the same person always gets the same avatar in a trip
const AVATAR_EMOJIS = [
    '🦁', '🐯', '🦊', '🐺',
    '🦅', '🦋', '🐉', '🦄',
    '🐬', '🦩', '🦖', '🦇',
    '🌵', '⚡', '🔥', '🌊',
    '🏔️', '🌙', '☀️', '🎯',
];

export const getAvatarColor = (index: number): string => {
    // Return a simple bg class for backward compat
    const classes = [
        'bg-violet-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
        'bg-blue-500', 'bg-cyan-500', 'bg-yellow-500', 'bg-pink-500',
        'bg-purple-500', 'bg-teal-500', 'bg-red-500', 'bg-sky-500',
    ];
    return classes[index % classes.length];
};

export const getAvatarEmoji = (index: number): string => {
    return AVATAR_EMOJIS[index % AVATAR_EMOJIS.length];
};

interface MemberAvatarProps {
    name: string;
    index: number;
    size?: 'sm' | 'md' | 'lg';
    isYou?: boolean;
}

const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
};

const radii = {
    sm: 'rounded-xl',
    md: 'rounded-2xl',
    lg: 'rounded-3xl',
};

const MemberAvatar: React.FC<MemberAvatarProps> = ({ name, index, size = 'md', isYou = false }) => {
    const gradient = isYou ? 'from-violet-500 to-[#b613ec]' : GRADIENTS[index % GRADIENTS.length];
    const emoji = getAvatarEmoji(isYou ? 0 : index);

    return (
        <div
            className={`${sizeClasses[size]} ${radii[size]} bg-gradient-to-br ${gradient} flex items-center justify-center shadow-md shrink-0 select-none relative overflow-hidden`}
            title={name}
        >
            {/* Subtle inner glow */}
            <div className="absolute inset-0 bg-white/10 rounded-inherit" />
            <span className="relative z-10 leading-none">{emoji}</span>
        </div>
    );
};

export default MemberAvatar;

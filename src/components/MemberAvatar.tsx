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

const AVATAR_EMOJIS = [
    '🦁', '🐯', '🦊', '🐺',
    '🦅', '🦋', '🐉', '🦄',
    '🐬', '🦩', '🦖', '🦇',
    '🌵', '⚡', '🔥', '🌊',
    '🏔️', '🌙', '☀️', '🎯',
];

export const getAvatarColor = (index: number): string => {
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

export const getAvatarGradient = (index: number): string => {
    return GRADIENTS[index % GRADIENTS.length];
};

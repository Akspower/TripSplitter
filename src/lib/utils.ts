export function clsx(...classes: (string | undefined | null | false)[]) {
    return classes.filter(Boolean).join(' ');
}

import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
    return twMerge(clsx(...inputs));
}

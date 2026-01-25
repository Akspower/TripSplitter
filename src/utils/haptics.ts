export const vibrate = (pattern: number | number[] = 10) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore errors on devices that don't support it or block it
        }
    }
};

export const HapticPatterns = {
    soft: 8,
    medium: 15,
    heavy: 30,
    success: [10, 40, 10],
    error: [40, 40, 40, 40],
    toggle: 12,
    warning: 30
};

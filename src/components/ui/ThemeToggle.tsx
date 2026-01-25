import { SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { useTheme } from '../../contexts/ThemeContext';
import { vibrate, HapticPatterns } from '../../utils/haptics';

export default function ThemeToggle() {
    const { setTheme, isDark } = useTheme();

    const toggleTheme = () => {
        vibrate(HapticPatterns.soft);
        setTheme(isDark ? 'light' : 'dark');
    };

    return (
        <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all duration-200"
            aria-label="Toggle theme"
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            {isDark ? (
                <SunIcon className="w-5 h-5 text-amber-400" />
            ) : (
                <MoonIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            )}
        </button>
    );
}

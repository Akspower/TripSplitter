import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType>({
    theme: 'system',
    setTheme: () => { },
    isDark: false
});

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>(() => {
        return (localStorage.getItem('theme') as Theme) || 'system';
    });

    const [isDark, setIsDark] = useState(false);

    useEffect(() => {
        const root = window.document.documentElement;

        const applyTheme = () => {
            let darkMode = false;

            if (theme === 'dark') {
                darkMode = true;
            } else if (theme === 'light') {
                darkMode = false;
            } else {
                // system
                darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
            }

            setIsDark(darkMode);

            if (darkMode) {
                root.classList.add('dark');
            } else {
                root.classList.remove('dark');
            }
        };

        applyTheme();
        localStorage.setItem('theme', theme);

        // Listen for system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handler = () => theme === 'system' && applyTheme();
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, isDark }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);

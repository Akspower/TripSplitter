import React, { useState, useEffect, useCallback } from 'react';
import { getNextQuote, getRandomQuote } from '../utils/quotes';
import type { Quote } from '../utils/quotes';

interface QuoteBarProps {
    category?: Quote['category'];
    /** Auto-rotate interval in ms. Default 8000. Set 0 to disable auto-rotate. */
    interval?: number;
    className?: string;
    compact?: boolean; // smaller pill style vs full card
}

const QuoteBar: React.FC<QuoteBarProps> = ({
    category,
    interval = 8000,
    className = '',
    compact = false,
}) => {
    const [quote, setQuote] = useState<Quote>(() => getRandomQuote(category));
    const [visible, setVisible] = useState(true);

    const rotate = useCallback(() => {
        setVisible(false);
        setTimeout(() => {
            setQuote(getNextQuote(category));
            setVisible(true);
        }, 350); // matches fade-out duration
    }, [category]);

    // Auto-rotate
    useEffect(() => {
        if (!interval) return;
        const timer = setInterval(rotate, interval);
        return () => clearInterval(timer);
    }, [rotate, interval]);

    if (compact) {
        return (
            <button
                onClick={rotate}
                className={`w-full flex items-start gap-2.5 px-4 py-3 rounded-2xl bg-[#b613ec]/8 border border-[#b613ec]/15 text-left active:scale-[0.99] transition-all touch-manipulation ${className}`}
            >
                <span className="text-lg shrink-0 mt-0.5">💬</span>
                <p
                    className="text-xs font-medium text-[rgba(244,244,248,0.55)] leading-relaxed italic flex-1"
                    style={{
                        opacity: visible ? 1 : 0,
                        transition: 'opacity 0.35s ease',
                    }}
                >
                    "{quote.text}"
                </p>
            </button>
        );
    }

    return (
        <button
            onClick={rotate}
            className={`w-full relative overflow-hidden rounded-3xl border border-[#b613ec]/20 text-left touch-manipulation group ${className}`}
            style={{ background: 'rgba(182,19,236,0.05)' }}
            title="Tap for a new quote"
        >
            {/* Animated shimmer stripe */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                <div
                    className="absolute top-0 left-0 h-full w-1/3 opacity-0 group-active:opacity-100"
                    style={{
                        background: 'linear-gradient(90deg, transparent, rgba(182,19,236,0.08), transparent)',
                        transition: 'opacity 0.2s',
                    }}
                />
            </div>

            <div className="px-5 py-4 flex items-start gap-3">
                {/* Quote mark decoration */}
                <div className="shrink-0 w-8 h-8 rounded-xl bg-[#b613ec]/15 border border-[#b613ec]/25 flex items-center justify-center">
                    <span className="text-[#b613ec] text-sm font-black">"</span>
                </div>

                <div className="flex-1 min-w-0">
                    <p
                        className="text-sm font-medium text-[rgba(244,244,248,0.65)] leading-relaxed italic"
                        style={{
                            opacity: visible ? 1 : 0,
                            transform: visible ? 'translateY(0)' : 'translateY(4px)',
                            transition: 'opacity 0.35s ease, transform 0.35s ease',
                        }}
                    >
                        {quote.text}
                    </p>
                </div>
            </div>
        </button>
    );
};

export default QuoteBar;

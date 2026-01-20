import Groq from "groq-sdk";
import type { Trip } from "../types";

const apiKey = import.meta.env.VITE_GROQ_API_KEY;

// Initialize Groq client
// dangerouslyAllowBrowser is required for client-side usage
const groq = apiKey ? new Groq({
    apiKey,
    dangerouslyAllowBrowser: true
}) : null;

// Retry helper with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (prompt: string, maxRetries = 3): Promise<string> => {
    if (!groq) throw new Error("Groq not initialized");

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "You are 'SplitWay Buddy', a super friendly, local Indian travel expert. Your vibe is enthusiastic, helpful, and concise. use emojis liberally. formatting should be clean markdown."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                model: "mixtral-8x7b-32768", // Switching to Mixtral for better stability
                temperature: 0.7, // Slightly lower for more reliable output
                max_tokens: 1024,
            });

            return completion.choices[0]?.message?.content || "No insights available.";
        } catch (error: any) {
            const isRetryable = error?.status === 429 || error?.status >= 500;

            if (isRetryable && attempt < maxRetries) {
                // console.log(`AI retry attempt ${attempt}/${maxRetries}...`);
                await delay(2000 * attempt);
                continue;
            }
            throw error;
        }
    }
    throw new Error('Max retries exceeded');
};

export const getTripInsights = async (trip: Trip) => {
    if (!groq) return "⚠️ AI Guide is not configured. Add VITE_GROQ_API_KEY!";

    // Calculate date info
    const startDate = new Date(trip.startDate);
    const month = startDate.toLocaleString('en-IN', { month: 'long' });
    const tripDays = Math.ceil((new Date(trip.endDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate Spending Stats
    const spending: Record<string, number> = {};
    trip.members.forEach(m => spending[m.id] = 0);
    trip.expenses.forEach(e => {
        spending[e.payerId] = (spending[e.payerId] || 0) + e.amount;
    });

    const sortedSpenders = Object.entries(spending)
        .sort(([, a], [, b]) => b - a)
        .map(([id, amt]) => ({
            name: trip.members.find(m => m.id === id)?.name || 'Unknown',
            amt
        }));

    const highestPayer = sortedSpenders[0];
    const topSpendersText = sortedSpenders.slice(0, 3).map(s => `${s.name} (₹${s.amt})`).join(', ');

    const prompt = `
    Context: Trip to ${trip.destination}, ${tripDays} days in ${month}. Vibe: ${trip.tripStyle || 'Adventure'}.
    Who's spending: ${topSpendersText}.
    Total Items: ${trip.expenses.length}.
    
    You are a funny, slightly sarcastic, roast-friendly travel buddy. You are NOT an AI. You are just a smart friend.
    
    Task:
    1. Roast the top spender (${highestPayer?.name}) gently for being rich, or the group for being broke.
    2. Give 2 genuinely cool, non-touristy recommendations for ${trip.destination}.
    3. Add a "Pro Tip" that sounds like a local secret.
    
    Format:
    - Keep it SHORT (under 80 words).
    - Use fun emojis.
    - No robotic intros like "Here is an analysis". Just dive in.
    `;

    try {
        return await generateWithRetry(prompt);
    } catch (error: any) {
        console.warn("Groq AI Error:", error); // Use warn instead of error to avoid noise

        // Fallback tips
        const fallbackTips = getFallbackTips(trip.destination, trip.tripStyle || 'adventure');

        // Return a cleaner error/fallback state
        return `
### 🌟 Quick Tips for ${trip.destination}

${fallbackTips}

---
_Note: Our AI guide is taking a chai break (Server Issues). Showing offline tips!_
        `;
    }
};

// Preloaded tips for popular Indian destinations (Kept same as before)
const getFallbackTips = (destination: string, style: string): string => {
    const dest = destination.toLowerCase();

    const tips: Record<string, string> = {
        'goa': `
🏖️ **Beach Vibes**
- North Goa for parties, South Goa for peace
- Try fish thali at local shacks (₹150-200)
- Rent a scooty - best way to explore!

💡 **Pro Tip:** Visit Anjuna Flea Market on Wednesdays
    `,
        'manali': `
🏔️ **Mountain Magic**
- Old Manali has the best cafes & vibes
- Try Siddu and Trout fish - local delights!
- Book Rohtang permits in advance

💡 **Pro Tip:** Jogini Waterfall trek is free & stunning
    `,
        'jaipur': `
🏰 **Pink City**
- Get combo tickets for forts (saves ₹200+)
- Dal Baati Churma is a must-try!
- Shop at Johari Bazaar for gems

💡 **Pro Tip:** Visit Nahargarh Fort at sunset
    `,
        'ladakh': `
🏔️ **Land of High Passes**
- Acclimatize for 2 days before adventure
- Carry cash - ATMs are rare
- Try Thukpa and Momos everywhere!

💡 **Pro Tip:** Pangong Lake sunrise > sunset
    `,
        'kerala': `
🌴 **God's Own Country**
- Houseboat in Alleppey = must do!
- Try authentic Sadya meal on banana leaf
- Munnar tea gardens are magical

💡 **Pro Tip:** Book homestays for authentic experience
    `,
        'rishikesh': `
🧘 **Yoga Capital**
- Laxman Jhula area for cafes & shopping
- Go rafting (Shivpuri to Rishikesh)
- Beatles Ashram for silence

💡 **Pro Tip:** Ganga Aarti at Parmarth Niketan is pure bliss
    `,
        'dharamshala': `
🏔️ **Little Tibet**
- McLeod Ganj for Tibetan culture
- Triund Trek for views
- Visit Dalai Lama Temple

💡 **Pro Tip:** Try momos at Tibet Kitchen
    `
    };

    for (const [key, tip] of Object.entries(tips)) {
        if (dest.includes(key)) return tip;
    }

    return `
🎒 **Travel Smart (${style} Style)**
- Keep cash handy for local spots
- Download offline maps
- Ask locals for the best food joints!

💡 **Pro Tip:** Early mornings = fewer crowds & best photos!
  `;
};

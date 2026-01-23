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
                model: "llama-3.3-70b-versatile", // Switched to Llama 3.3 for better availability
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
        const fallbackTips = getFallbackTips(trip.destination, trip.members);

        // Return a cleaner error/fallback state
        return `
### 🌟 Quick Tips for ${trip.destination}

${fallbackTips}

---
---
_Note: AI Guide is offline. Error: ${error.message || 'Unknown Error'} (Status: ${error.status || 'N/A'})_
        `;
    }
};

// Preloaded tips for popular Indian destinations (Kept same as before)
const getFallbackTips = (destination: string, members: { name: string }[]): string => {
    const dest = destination.toLowerCase();

    // 1. Destination-Specific Tips (Static but solid)
    const specificTips: Record<string, string[]> = {
        'goa': [
            "🏖️ **Beach Mode**: North for buzzing parties, South for peace. Don't forget sunscreen!",
            "🛵 **Scooty Life**: Rent a bike. It's the law of Goa. Also, fish thali is mandatory.",
            "💡 **Pro Tip**: Anjuna Flea Market on Wednesday is a vibe."
        ],
        'manali': [
            "🏔️ **Mountain High**: Old Manali cafes > Mall Road crowd. Trust me.",
            "🍜 **Foodie Alert**: Eat Siddu. It's like a steamed bun hug for your stomach.",
            "💡 **Pro Tip**: Jogini Waterfall trek is free and totally worth the cardio."
        ],
        'jaipur': [
            "🏰 **Royal Vibes**: Get the composite ticket for forts. Saves money for lassi.",
            "🛍️ **Shop Smart**: Johari Bazaar for shiny things. Bargain like your life depends on it.",
            "💡 **Pro Tip**: Nahargarh Fort sunset. Best view in the city, hands down."
        ],
        // ... (Keep other destinations if needed, or stick to generic for now to save space)
    };

    // 2. Generic "Roast" / Funny Templates for ANY location
    const funnyTemplates = [
        "🎒 **Travel wisdom**: {randomMember} is probably going to overpack. Don't let them!",
        "💸 **Budget Check**: Keep an eye on {randomMember}, they look ready to splurge on something useless.",
        "🗺️ **Navigation**: If {randomMember} is navigating, you ARE getting lost. Use Google Maps.",
        "📸 **Photo Op**: {randomMember} will take 500 photos of the same tree. Be patient.",
        "☕ **Caffeine Fix**: Find the nearest cafe before {randomMember} gets cranky.",
        "🍕 **Foodie Tip**: If you can't decide where to eat, just let {randomMember} choose. They have good taste (usually).",
        "🛑 **Safety First**: Don't do anything {randomMember} wouldn't do. Actually, that sets the bar too low.",
        "🌅 **Sunrise Mission**: Wake up early! Or just drag {randomMember} out of bed at 11 AM."
    ];

    // Helper to get random item
    const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomMember = members.length > 0 ? pick(members).name : "someone";

    // Check for specific destination match
    for (const [key, tips] of Object.entries(specificTips)) {
        if (dest.includes(key)) {
            return tips.join('\n\n');
        }
    }

    // Default: Random Mix
    const template1 = pick(funnyTemplates).replace('{randomMember}', randomMember);
    // Ensure 2nd template uses a different member if possible
    const otherMembers = members.filter(m => m.name !== randomMember);
    const secondMember = otherMembers.length > 0 ? pick(otherMembers).name : members[0]?.name || "friend";
    const template2 = pick(funnyTemplates.filter(t => t !== template1)).replace('{randomMember}', secondMember);

    return `
### 🎲 Random Trip Wisdom

${template1}

${template2}

💡 **Pro Tip**: Asking locals for food recs is always better than Google!
    `;
};

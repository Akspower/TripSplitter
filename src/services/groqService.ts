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
                model: "llama-3.3-70b-versatile",
                temperature: 0.7,
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

    const prompt = `
    Analyze this trip to ${trip.destination} for the "${trip.name}" group.
    
    **Context:**
    - Dates: ${trip.startDate} to ${trip.endDate} (${tripDays} days in ${month})
    - People: ${trip.members.map(m => m.name).join(', ')}
    - Vibe: ${trip.tripStyle || 'Adventure'}
    - Budget: ${trip.budgetType || 'Moderate'}
    
    **Expenses so far (₹):**
    ${trip.expenses.length > 0 ? trip.expenses.slice(-10).map(e =>
        `- ${e.description}: ₹${e.amount} (${e.category}) by ${trip.members.find(m => m.id === e.payerId)?.name}`
    ).join('\n') : 'No expenses yet.'}

    **Task (Keep it fast & friendly! Max 150 words):**
    1. 💸 **Money Talk:** Who is paying the most? Any quick balance update?
    2. 🗺️ **Local Secrets:** Give 2 specific hidden gems or food spots in ${trip.destination} for ${month}.
    3. 💡 **Pro Hack:** One money-saving tip for ${trip.budgetType} travelers here.

    Output in concise markdown. Be super encouraging!
    `;

    try {
        return await generateWithRetry(prompt);
    } catch (error: any) {
        // console.error("Groq AI Error:", error);

        // Fallback tips
        const fallbackTips = getFallbackTips(trip.destination, trip.tripStyle || 'adventure');

        return `
### 🌟 Quick Tips for ${trip.destination}

${fallbackTips}

---
_AI service unavailable. Showing offline tips._
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

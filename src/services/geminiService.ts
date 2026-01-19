import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Trip } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Retry helper with exponential backoff
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const generateWithRetry = async (model: any, prompt: string, maxRetries = 3): Promise<string> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error: any) {
      const isRetryable = error?.message?.includes('503') ||
        error?.message?.includes('overloaded') ||
        error?.message?.includes('unavailable');

      if (isRetryable && attempt < maxRetries) {
        console.log(`AI retry attempt ${attempt}/${maxRetries}...`);
        await delay(2000 * attempt); // 2s, 4s, 6s
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

export const getTripInsights = async (trip: Trip) => {
  if (!genAI) return "⚠️ AI Guide is not configured. Contact the trip admin!";

  // Using Gemini 1.5 Flash for better stability on free tier
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  // Calculate date info for seasonal awareness
  const startDate = new Date(trip.startDate);
  const month = startDate.toLocaleString('en-IN', { month: 'long' });
  const tripDays = Math.ceil((new Date(trip.endDate).getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const prompt = `
You are "SplitWay Guide" - a smart, concise travel companion for India trips.

**TRIP PROFILE:**
- Title: "${trip.name}"
- Destination: ${trip.destination}
- When: ${trip.startDate} to ${trip.endDate} (${tripDays} days in ${month})
- Squad: ${trip.members.map(m => m.name).join(', ')} (${trip.members.length} people)
- Style: ${trip.tripStyle || 'adventure'}
- Budget: ${trip.budgetType || 'moderate'}
- Age Group: ${trip.ageGroup || 'mixed'}

**EXPENSES (₹):** 
${trip.expenses.length > 0 ? JSON.stringify(trip.expenses.slice(-8).map(e => ({
    desc: e.description,
    amt: e.amount,
    by: trip.members.find(m => m.id === e.payerId)?.name
  }))) : 'No expenses yet'}

**YOUR TASK (BE CONCISE - MAX 120 words):**
1. 💰 Quick spending check: Who paid most? Who should pay next?
2. 🎯 2-3 ${trip.destination} tips for a ${trip.tripStyle || 'adventure'} trip in ${month}
3. 💡 One ${trip.budgetType || 'moderate'}-friendly hack for ${trip.ageGroup || 'mixed'} travelers

Use emojis. Mention squad members by name. Be specific to ${trip.destination}!
`;

  try {
    return await generateWithRetry(model, prompt);
  } catch (error: any) {
    console.error("AI Guide Error:", error);

    // Fallback tips for popular destinations
    const fallbackTips = getFallbackTips(trip.destination, trip.tripStyle || 'adventure');

    return `
### 🌟 Quick Tips for ${trip.destination}

${fallbackTips}

---
_AI Guide is taking a breather. Tap ↻ to try again!_
    `;
  }
};

// Preloaded tips for popular Indian destinations
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
- White water rafting starts at ₹500
- Beatles Ashram for sunset views

💡 **Pro Tip:** Evening Ganga Aarti is free & magical
    `,
    'ladakh': `
🏔️ **Land of High Passes**
- Acclimatize for 2 days before adventure
- Carry cash - ATMs are rare
- Try Thukpa and Momos everywhere!

💡 **Pro Tip:** Pangong Lake sunrise > sunset
    `,
    'dharamshala': `
🏔️ **Little Tibet**
- McLeod Ganj has amazing Tibetan food
- Trek to Triund for stunning views
- Visit Dalai Lama Temple Complex

💡 **Pro Tip:** Try momos at Tibet Kitchen!
    `,
  };

  // Check if destination matches any known places
  for (const [key, tip] of Object.entries(tips)) {
    if (dest.includes(key)) return tip;
  }

  // Generic tips based on style
  return `
🎒 **Travel Smart (${style} Style)**
- Keep ₹500-1000 cash for emergencies
- Download offline maps before heading out
- Local food > tourist restaurants (cheaper & tastier!)

💡 **Pro Tip:** Ask locals for hidden gems - they know best!
  `;
};
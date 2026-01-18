import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Trip } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export const getTripInsights = async (trip: Trip) => {
  if (!genAI) return "⚠️ API Key missing. Check .env file!";

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `
    Analyze this trip data for a trip in India and provide:
    1. A summary of spending habits (Total in Indian Rupees ₹).
    2. Suggest who should pay for the next meal/activity to keep it fair.
    3. Three specific travel hacks/tips for "${trip.destination}" (mention best local street food or travel modes like Rickshaw/Metros).
    
    Trip Data:
    Name: ${trip.name}
    Destination: ${trip.destination}
    Duration: ${trip.startDate} to ${trip.endDate}
    Members: ${trip.members.map(m => m.name).join(', ')}
    Expenses (all amounts in ₹): ${JSON.stringify(trip.expenses.map(e => ({
    desc: e.description,
    amount: e.amount,
    payer: trip.members.find(m => m.id === e.payerId)?.name,
    participantsCount: e.participantIds.length
  })))}
    
    Format the response with emoji-rich markdown. Be helpful and friendly.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Something went wrong with the AI implementation. Please verify your API key and connection.";
  }
};
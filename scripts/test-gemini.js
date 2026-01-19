import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = "AIzaSyA2pqDSxoe8mea5uvy-t4DzLbLJce7lAdQ";
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

console.log("Testing key...");

try {
    const result = await model.generateContent("Reply with 'Working' if you see this.");
    const response = await result.response;
    console.log("SUCCESS");
    console.log(response.text());
} catch (error) {
    console.log("ERROR");
    console.log(error.message);
}

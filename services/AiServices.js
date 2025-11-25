import { GoogleGenAI } from "@google/genai";

// ⚠️ Security Warning: Do not store keys in plain text in production.
const API_KEY = "AIzaSyA8dUQ3N9lEfjJFSDzHGUCSyETN53aoXqQ"; 

// Initialize the client with your API key
const ai = new GoogleGenAI({ apiKey: API_KEY });

export const getScheduleRecommendation = async (userTasks, userPrompt) => {
  try {
    const currentDate = new Date();
    const dateString = currentDate.toDateString();
    const timeString = currentDate.toLocaleTimeString();

    // 1. Construct the Prompt
    const prompt = `
      You are a smart scheduling assistant.
      
      **Context:**
      - Current Date & Time: ${dateString}, ${timeString}
      - Existing Tasks: ${JSON.stringify(userTasks)}
      
      **User Request:** "${userPrompt}"
      
      **Goal:** Analyze the schedule and suggest the best conflict-free time for the request.
      
      **Output Requirement:**
      Return ONLY a valid JSON object. No markdown, no backticks.
      Structure:
      {
        "title": "Task Title",
        "description": "Brief description",
        "date": "YYYY-MM-DD",
        "time": "HH:MM AM/PM",
        "reason": "Why this time works"
      }
    `;

    // 2. Configure the Model & Request
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp", // or "gemini-1.5-flash"
      contents: prompt,
      config: {
        responseMimeType: "application/json", 
      }
    });

    // 3. Parse and Return
    // FIX: response.text is a property, NOT a function
    let text = response.text; 
    
    // Clean up potential markdown formatting if it exists
    if (text) {
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    }
    
    console.log("AI Response:", text);
    return JSON.parse(text);

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};
import { GoogleGenerativeAI } from "@google/generative-ai";

// ⚠️ Replace with your actual API Key
const API_KEY = "API_KEY_HERE"; 

const genAI = new GoogleGenerativeAI(API_KEY);

export const getScheduleRecommendation = async (userTasks, userPrompt) => {
  try {
    // FIX: Changed model to 'gemini-1.5-flash-latest' to resolve 404 error
    const model = genAI.getGenerativeModel({ 
        model: "gemini-1.5-flash-latest", 
        generationConfig: { responseMimeType: "application/json" } 
    });

    const currentDate = new Date();
    const dateString = currentDate.toDateString();
    const timeString = currentDate.toLocaleTimeString();

    const prompt = `
      You are a smart scheduling assistant for a React Native app.
      
      **Context:**
      - Current Date & Time: ${dateString}, ${timeString}
      - The user's existing schedule/tasks: ${JSON.stringify(userTasks)}
      
      **User Request:** "${userPrompt}"
      
      **Goal:**
      Analyze the existing schedule to find a conflict-free or optimal slot for the user's request. 
      If the user request implies a specific time (e.g., "tomorrow morning"), prioritize that.
      
      **Output Requirement:**
      Return ONLY a valid JSON object with no markdown formatting. The JSON must match this structure:
      {
        "title": "Short title for the task",
        "description": "Brief description",
        "date": "YYYY-MM-DD",
        "time": "HH:MM AM/PM",
        "reason": "Short explanation (e.g., 'You are free between 2 PM and 4 PM')"
      }
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const recommendation = JSON.parse(text);
    return recommendation;

  } catch (error) {
    console.error("AI Service Error:", error);
    throw error;
  }
};
const { GoogleGenerativeAI } = require("@google/generative-ai");

async function listAllModels() {
  const key = "AIzaSyBO0hokJ98LNYAh72DVTtJTrBUJW97CCzk"; // Using the one that was leaked just for local discovery
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();
    if (!data.models) {
        console.log("ERROR:", data);
        return;
    }
    const generateModels = data.models
        .filter(m => m.supportedGenerationMethods.includes("generateContent"))
        .map(m => m.name.replace("models/", ""));
    
    console.log("VALID_MODELS:", JSON.stringify(generateModels));
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

listAllModels();

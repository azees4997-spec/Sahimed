const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const key = "AIzaSyBZjPHZjLz6TgXIAkqQ3uCsaAfO0HUj4qc";
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Use flash for faster test
    const result = await model.generateContent("Say hello");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

testKey();

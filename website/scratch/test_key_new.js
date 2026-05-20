const { GoogleGenerativeAI } = require("@google/generative-ai");

async function testKey() {
  const key = "AIzaSyBO0hokJ98LNYAh72DVTtJTrBUJW97CCzk";
  try {
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("SUCCESS:", result.response.text());
  } catch (error) {
    console.error("FAILED:", error.message);
  }
}

testKey();

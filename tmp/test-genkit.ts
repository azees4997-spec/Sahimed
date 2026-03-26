
import { prescriptionAnalysisAndPreFill } from '../src/ai/flows/prescription-analysis-and-pre-fill-flow';

async function test() {
  console.log("Testing Genkit AI flow...");
  // Using a tiny placeholder 1x1 black pixel base64 for testing API connectivity
  const sampleImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  try {
    const result = await prescriptionAnalysisAndPreFill({ prescriptionImageUri: sampleImage });
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Flow failed:", err);
  }
}

test();

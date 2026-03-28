"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.prescriptionAnalysisAndPreFillFlow = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
(0, app_1.initializeApp)();
exports.prescriptionAnalysisAndPreFillFlow = (0, https_1.onCall)({
    cors: true,
}, async (request) => {
    // Move heavy imports and initialization inside the handler
    const { genkit, z } = await Promise.resolve().then(() => __importStar(require('genkit')));
    const { googleAI } = await Promise.resolve().then(() => __importStar(require('@genkit-ai/google-genai')));
    const ai = genkit({
        plugins: [googleAI()],
        model: 'googleai/gemini-2.0-flash',
    });
    const MedicationDetailsSchema = z.object({
        drugName: z.string().describe('The name of the medication.'),
        dosage: z.string().describe('The dosage of the medication (e.g., "500mg", "1 tablet").'),
        quantity: z.number().describe('The quantity of the medication (e.g., "30" for 30 pills).'),
        instructions: z
            .string()
            .describe('Instructions for taking the medication (e.g., "once daily", "with food").'),
    });
    const PrescriptionAnalysisAndPreFillInputSchema = z.object({
        prescriptionImageUri: z
            .string()
            .describe("A prescription image, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
    });
    const PrescriptionAnalysisAndPreFillOutputSchema = z.object({
        isLegible: z
            .boolean()
            .describe('True if the prescription image is clear and readable, false otherwise.'),
        medications: z
            .array(MedicationDetailsSchema)
            .describe('An array of extracted medication details if the prescription is legible.'),
        analysisSummary: z
            .string()
            .describe('A summary of the analysis, including any identified issues or uncertainties in extraction.'),
    });
    const prompt = ai.definePrompt({
        name: 'prescriptionAnalysisAndPreFillPrompt',
        input: { schema: PrescriptionAnalysisAndPreFillInputSchema },
        output: { schema: PrescriptionAnalysisAndPreFillOutputSchema },
        prompt: `You are an AI assistant specialized in analyzing medical prescriptions.
Your task is to examine the provided prescription image, determine its legibility, and extract key medication details.

First, assess the overall legibility of the prescription image. If the image is blurry, poorly lit, or otherwise unreadable, set 'isLegible' to false and provide a brief explanation in 'analysisSummary'.

If the prescription is legible, proceed to extract the following details for each medication listed:
- Drug Name
- Dosage (e.g., 500mg, 1 tablet)
- Quantity (e.g., 30 pills)
- Instructions (e.g., once daily, with food)

Compile these details into an array of medication objects. If any detail is unclear or missing for a particular medication, make your best educated guess based on common prescription formats and note any uncertainties in the 'analysisSummary'.

Finally, provide a concise 'analysisSummary' covering the legibility assessment and any difficulties encountered during extraction, or confirm successful extraction.

Prescription Image: {{media url=prescriptionImageUri}}`,
        config: {
            safetySettings: [
                {
                    category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
                    threshold: 'BLOCK_NONE',
                },
                {
                    category: 'HARM_CATEGORY_MEDICAL',
                    threshold: 'BLOCK_NONE',
                },
            ],
        },
    });
    const { output } = await prompt(request.data);
    return output;
});
//# sourceMappingURL=index.js.map
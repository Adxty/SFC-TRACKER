
import { GoogleGenAI, Type } from "@google/genai";
import { Expense, Truck } from "./types";

const getAI = () => new GoogleGenAI({ apiKey: import.meta.env.VITE_GOOGLE_API_KEY });

/**
 * World-class fleet analysis assistant
 */
export async function askGemini(question: string, context: { expenses: Expense[], trucks: Truck[], language?: string }) {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';
  
  const systemPrompt = `You are "SFC ANALYST PRO", a world-class fleet management expert. 
  You have full access to the business data provided. 
  Current Language: ${context.language || 'en'}. 
  Reply in the requested language.
  
  Fleet Summary: ${context.trucks.length} vehicles.
  Recent Expenses: ${context.expenses.length} records.
  
  Instructions:
  1. Analyze CPK (Cost per KM) trends.
  2. Identify specific trucks that are leaking money on fuel or maintenance.
  3. Provide GST filing advice (ITC eligibility).
  4. Always suggest data-driven optimizations.
  5. Keep data security and confidentiality in mind.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: question,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.5,
      }
    });
    return response.text || "I'm sorry, I couldn't process that request.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "AI Error. Verify your API key or connectivity.";
  }
}

/**
 * Extract data from transport receipts using AI-OCR
 */
export async function scanReceipt(base64Image: string): Promise<Partial<Expense>> {
  const ai = getAI();
  const model = 'gemini-3-flash-preview';
  
  const prompt = "Analyze this receipt image from a transportation business. Extract: date (YYYY-MM-DD), total amount (INR), category (Fuel, Toll, Maintenance, etc.), vendor name, and GST amount if present.";

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType: 'image/jpeg' } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING },
            amount: { type: Type.NUMBER },
            category: { type: Type.STRING },
            vendor: { type: Type.STRING },
            gstPaid: { type: Type.NUMBER },
            description: { type: Type.STRING }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("OCR Error:", error);
    return {};
  }
}

/**
 * Plan optimized routes using Gemini 3 Pro reasoning + Google Search Grounding for real-time conditions.
 * It re-orders waypoints for maximum efficiency (TSP optimization).
 */
export async function planOptimizedRoute(
  origin: string, 
  destination: string, 
  waypoints: string[]
): Promise<{ 
  text: string, 
  mapsUrl: string, 
  optimizedWaypoints: string[], 
  groundingSources: {title: string, uri: string}[] 
}> {
  const ai = getAI();
  const model = 'gemini-3-pro-preview';

  const prompt = `Optimize the route for a heavy commercial truck.
  Origin: ${origin}
  Destination: ${destination}
  Delivery Stops: ${waypoints.join(', ')}

  Tasks:
  1. Re-order the delivery stops to ensure the shortest and most fuel-efficient sequence (Traveling Salesperson Logic).
  2. Research current traffic conditions, road closures, or construction on these routes using Google Search.
  3. Provide a detailed reasoning for the sequence.
  4. Provide a Google Maps URL for the FINAL optimized sequence.

  Return the response in JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
              type: Type.STRING, 
              description: "A detailed explanation of the route optimization and traffic reasoning." 
            },
            optimizedWaypoints: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "The list of delivery stops in the optimized order."
            },
            mapsUrl: { 
              type: Type.STRING, 
              description: "The Google Maps directions URL." 
            }
          },
          required: ["text", "optimizedWaypoints", "mapsUrl"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    
    // Extract grounding sources as required by guidelines for Search Grounding
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = chunks.map((chunk: any) => ({
      title: (chunk.web && chunk.web.title) || "Search Source",
      uri: (chunk.web && chunk.web.uri) || "#"
    })).filter((s: any) => s.uri !== "#");

    return {
      text: result.text || "No optimization details provided.",
      optimizedWaypoints: result.optimizedWaypoints || waypoints,
      mapsUrl: result.mapsUrl || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints.join('|'))}`,
      groundingSources: sources
    };
  } catch (error) {
    console.error("Routing AI Error:", error);
    return {
      text: "Error optimizing route with AI. Using default mapping.",
      optimizedWaypoints: waypoints,
      mapsUrl: `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&waypoints=${encodeURIComponent(waypoints.join('|'))}`,
      groundingSources: []
    };
  }
}

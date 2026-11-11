import { NextRequest } from "next/server";
import { ai, DEFAULT_MODEL, SYSTEM_PROMPT } from "@/lib/gemini";
import { findCropContext, findPestOrTreatment } from "@/lib/agronomy-data";

export async function POST(req: NextRequest) {
  try {
    const { message, image, history } = await req.json();

    if (!message && !image) {
      return new Response(JSON.stringify({ error: "Message or image is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 1. Domain Grounding Lookup
    const userText = message || "";
    const cropContext = findCropContext(userText);
    const pestContext = findPestOrTreatment(userText);

    let domainKnowledge = "";
    if (cropContext) domainKnowledge += `\n${cropContext}`;
    if (pestContext) domainKnowledge += `\n${pestContext}`;

    // 2. Prepare System Instruction
    let augmentedSystemInstruction = SYSTEM_PROMPT;
    if (domainKnowledge) {
      augmentedSystemInstruction += `\n\n--- GROUNDED AGRICULTURAL CONTEXT (LOCAL NIGERIAN DATA) ---\n${domainKnowledge}\nUse this specific local data (prices, varieties, dosage) in your response where relevant.`;
    }

    // Include plant disease reference if an image is provided
    if (image) {
      augmentedSystemInstruction += `\n\n--- MULTIMODAL INSTRUCTION ---
An image of a plant/leaf has been provided by the user.
1. Inspect the leaf or plant carefully.
2. Determine if the plant is HEALTHY or if there are symptoms of DISEASE, PEST INFESTATION, or NUTRIENT DEFICIENCY.
3. If diseased, identify the specific disease name (e.g. Tomato Late Blight, Maize Common Rust, Cassava Mosaic Disease) and assess severity (Low, Medium, High, Very High).
4. Provide immediate actionable treatments: both organic/cultural controls and local chemical remedies with approximate costs in Nigerian Naira (₦).
5. At the very beginning of your response, output a single diagnostic header line in this exact format:
[DIAGNOSIS: <Disease or "Healthy Plant"> | SEVERITY: <None/Low/Medium/High/Very High>]
Followed immediately by your comprehensive advice.`;
    }

    // 3. Assemble Conversation Contents
    const contents: Array<{
      role: "user" | "model";
      parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }>;
    }> = [];

    // Prior history if provided
    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        contents.push({
          role: item.role === "assistant" ? "model" : "user",
          parts: [{ text: item.content }],
        });
      }
    }

    // Current user message parts
    const currentParts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];

    if (image && typeof image === "string") {
      // Support Data URLs: "data:image/jpeg;base64,..."
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      } else {
        // Raw base64 default to image/jpeg
        currentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: image,
          },
        });
      }
    }

    currentParts.push({
      text: userText || "Please analyze this plant image and provide your agricultural assessment.",
    });

    contents.push({
      role: "user",
      parts: currentParts,
    });

    // 4. Stream response from Gemini
    const streamResult = await ai.models.generateContentStream({
      model: DEFAULT_MODEL,
      contents: contents as any,
      config: {
        systemInstruction: augmentedSystemInstruction,
        temperature: 0.3,
      },
    });

    // 5. Create ReadableStream to stream to client
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamResult) {
            const text = chunk.text;
            if (text) {
              controller.enqueue(encoder.encode(text));
            }
          }
          controller.close();
        } catch (err: any) {
          console.error("Stream error:", err);
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "An error occurred while processing your request.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

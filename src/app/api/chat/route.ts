import { NextRequest } from "next/server";
import { ai, DEFAULT_MODEL, SYSTEM_PROMPT } from "@/lib/gemini";
import { findCropContext, findPestOrTreatment } from "@/lib/agronomy-data";
import {
  GEMINI_TOOL_DECLARATIONS,
  executeGeminiTool,
} from "@/lib/gemini-tools";

export async function POST(req: NextRequest) {
  try {
    const { message, image, history } = await req.json();

    if (!message && !image) {
      return new Response(
        JSON.stringify({ error: "Message or image is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 1. Automatic Domain Grounding Lookup for fast text injection
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
      parts: Array<any>;
    }> = [];

    if (Array.isArray(history) && history.length > 0) {
      for (const item of history.slice(-6)) {
        if (item?.content) {
          contents.push({
            role: item.role === "assistant" ? "model" : "user",
            parts: [{ text: item.content }],
          });
        }
      }
    }

    const currentParts: Array<any> = [];

    if (image && typeof image === "string") {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        currentParts.push({
          inlineData: {
            mimeType: match[1],
            data: match[2],
          },
        });
      } else {
        currentParts.push({
          inlineData: {
            mimeType: "image/jpeg",
            data: image,
          },
        });
      }
    }

    currentParts.push({
      text:
        userText ||
        "Please analyze this plant image and provide your agricultural assessment.",
    });

    contents.push({
      role: "user",
      parts: currentParts,
    });

    // 4. Create ReadableStream supporting Gemini Function Calling + Token Streaming
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          const stream1 = await ai.models.generateContentStream({
            model: DEFAULT_MODEL,
            contents: contents as any,
            config: {
              systemInstruction: augmentedSystemInstruction,
              temperature: 0.3,
              tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
            },
          });

          const calls: Array<{
            id?: string;
            name?: string;
            args?: Record<string, unknown>;
          }> = [];
          const modelParts: Array<any> = [];

          for await (const chunk of stream1) {
            if (chunk.functionCalls && chunk.functionCalls.length > 0) {
              calls.push(...chunk.functionCalls);
            }
            const parts = chunk.candidates?.[0]?.content?.parts;
            if (parts && parts.length > 0) {
              for (const p of parts) {
                if (p && (p.functionCall || (typeof p.text === "string" && p.text.length > 0))) {
                  modelParts.push(p);
                }
              }
            }
            if (chunk.text && calls.length === 0) {
              controller.enqueue(encoder.encode(chunk.text));
            }
          }

          // If Gemini invoked tools (e.g. get_live_farm_sensors), execute & stream Turn 2
          if (calls.length > 0) {
            const functionResponseParts: Array<any> = [];

            for (const call of calls) {
              const fnName = call.name || "unknown_tool";
              const result = await executeGeminiTool(fnName, call.args || {});

              // Emit structured tool badge line into stream for frontend UI rendering
              controller.enqueue(
                encoder.encode(
                  `[TOOL_CALL: ${fnName} | SUMMARY: ${result.badgeSummary}]\n`
                )
              );

              functionResponseParts.push({
                functionResponse: {
                  name: fnName,
                  id: call.id,
                  response: result.response,
                },
              });
            }

            const followUpContents = [
              ...contents,
              { role: "model" as const, parts: modelParts },
              { role: "user" as const, parts: functionResponseParts },
            ];

            const stream2 = await ai.models.generateContentStream({
              model: DEFAULT_MODEL,
              contents: followUpContents as any,
              config: {
                systemInstruction: augmentedSystemInstruction,
                temperature: 0.3,
                tools: [{ functionDeclarations: GEMINI_TOOL_DECLARATIONS }],
              },
            });

            for await (const chunk of stream2) {
              if (chunk.text) {
                controller.enqueue(encoder.encode(chunk.text));
              }
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
        error:
          error.message || "An error occurred while processing your request.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

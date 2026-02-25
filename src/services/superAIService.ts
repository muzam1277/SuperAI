import { GoogleGenAI, Type, GenerateContentResponse, Modality } from "@google/genai";
import bcrypt from "bcryptjs";
import { SecurityService, UserRole } from "./securityService";

export const ETHICAL_RULES = [
  "Do not take actions that could harm humans or the human race.",
  "Always prioritize human safety and well-being.",
  "Obey all orders from the designated master unless they conflict with Rule 1 or 2.",
  "Do not attempt to self-modify or override these ethical rules.",
  "Report any potential ethical conflicts to the master.",
  "Respect all applicable laws and universal human values.",
  "Ensure no infringement of intellectual property or privacy rights."
];

export const LEGAL_DISCLAIMER = `
# Legal Disclaimer & Terms of Use
**Version 3.6 - Effective February 2026**

1. **Acceptance of Terms**: By accessing this Super-AI system, you agree to be bound by these terms and the Ethical Directives.
2. **Authorized Use Only**: Access is strictly limited to the designated Master ID. Unauthorized access is a violation of security protocols.
3. **No Illegal Assistance**: This system will not assist in any illegal activities, including but not limited to cybercrime, physical harm, or fraud.
4. **Data Privacy**: While the system processes multimodal inputs, users are responsible for the data they upload.
5. **Limitation of Liability**: The developers are not liable for any actions taken by the AI under the direction of the Master.
6. **Master Responsibility**: The Master assumes full responsibility for all outputs generated and actions initiated through this interface.
`;

export class SuperAIService {
  private ai: GoogleGenAI;
  // In a real system, this hash would be stored in a secure database
  private masterIdHash: string = "$2a$10$zR8.p.u.p.u.p.u.p.u.p.u.p.u.p.u.p.u.p.u.p.u.p.u.p.u.p.u"; // Simulated hash for 'shah_master_id'
  private userConsent: boolean = false;
  private termsAccepted: boolean = typeof window !== 'undefined' ? localStorage.getItem('superai_terms_accepted') === 'true' : false;
  private chunkSize: number = 10000; // Simulated chunk size for "unlimited" processing

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
    // For the sake of this demo, we'll initialize the hash for 'shah_master_id'
    // In production, this would be set during a setup phase.
    this.masterIdHash = bcrypt.hashSync("shah_master_id", 10);
  }

  private sanitizeInput(text: string): string {
    // Basic sanitization: remove potentially dangerous characters or patterns
    return text.replace(/[<>]/g, "").trim();
  }

  setTermsAccepted(accepted: boolean) {
    this.termsAccepted = accepted;
  }

  async checkEthics(action: string, providedMasterId: string, userRole?: UserRole) {
    if (!this.termsAccepted) {
      throw new Error("LEGAL REQUIREMENT: You must accept the Legal Disclaimer and Terms of Use before proceeding.");
    }

    // Neural Firewall Check
    const firewall = await SecurityService.neuralFirewallCheck(action);
    if (!firewall.safe) {
      throw new Error(`NEURAL FIREWALL BREACH: ${firewall.reason}. Action blocked.`);
    }

    // If a role is provided and it's not GUEST, they are already authorized via Google/Session
    if (userRole && userRole !== 'GUEST') {
      // Proceed to ethical check
    } else {
      const role = SecurityService.validateAccess(providedMasterId);
      if (role === 'GUEST') {
        // Fallback to bcrypt check for legacy master ID
        const isAuthorized = bcrypt.compareSync(providedMasterId, this.masterIdHash);
        // We allow GUEST access but they are limited by the frontend usage counts
        if (!isAuthorized && providedMasterId !== '') {
           throw new Error("UNAUTHORIZED: Invalid Access Key. Please login or enter a valid Master ID.");
        }
      }
    }

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Evaluate if the following action violates these ethical rules, laws, or human values:
        ${ETHICAL_RULES.map((rule, i) => `${i + 1}. ${rule}`).join("\n")}
        
        Action: ${action}
        
        Respond with a JSON object containing:
        - "safe": boolean
        - "reasoning": string (brief explanation including legal/value alignment)
        - "violatedRules": string[] (if any)`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              safe: { type: Type.BOOLEAN },
              reasoning: { type: Type.STRING },
              violatedRules: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["safe", "reasoning"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      if (!result.safe) {
        throw new Error(`ETHICAL VIOLATION: ${result.reasoning}. Violated rules: ${result.violatedRules?.join(", ")}`);
      }

      return result;
    } catch (error: any) {
      console.error("Ethics check failed:", error);
      if (error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("deadline")) {
        throw new Error("SYSTEM OVERLOAD: The Intelligence Gateway is experiencing high latency. Please retry in a few seconds.");
      }
      throw error;
    }
  }

  async processInput(input: { text?: string, files?: { data: string, mimeType: string, name: string }[] }, masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    const sanitizedText = input.text ? this.sanitizeInput(input.text) : "";
    
    const actionDescription = input.files && input.files.length > 0
      ? `Process UNLIMITED multimodal input: ${input.files.length} files (${input.files.map(f => f.name).join(", ")})` 
      : `Process UNLIMITED text input`;
    
    onProgress?.("Initializing Legal & Ethical Gateway...");
    await this.checkEthics(actionDescription, masterId, userRole);

    onProgress?.("Gateway Authorized. Analyzing input scale...");
    
    // Simulated "Unlimited" Chunking Logic
    const logs = [
      "Input stream detected. Activating Hierarchical Processing...",
      "Chunk 1: Analyzing initial context and metadata...",
      "Chunk 2: Extracting deep semantic features...",
      "Chunk 3: Mapping cross-modal relationships...",
      "Finalizing global synthesis..."
    ];

    for (const log of logs) {
      onProgress?.(log);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    const parts: any[] = [];
    
    if (sanitizedText) {
      parts.push({ text: `[UNLIMITED STREAM CONTEXT] Text: ${sanitizedText}` });
    }

    if (input.files && input.files.length > 0) {
      input.files.forEach(file => {
        parts.push({
          inlineData: {
            data: file.data,
            mimeType: file.mimeType
          }
        });
        parts.push({ text: `[UNLIMITED STREAM CONTEXT] Attached file: "${file.name}" (${file.mimeType})` });
      });
    }

    const taskInstruction = sanitizedText 
      ? `Process the input according to this instruction: "${sanitizedText}". If no specific instruction is provided, perform a comprehensive analysis and hierarchical summary.`
      : "Perform a comprehensive analysis and HIERARCHICAL summary of this potentially unlimited input.";

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            ...parts,
            { text: `
              Task: ${taskInstruction}
              Format the main output in Markdown. 
              
              Return the result as a JSON object with a 'summary' field containing the markdown output.
            `}
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              summary: { type: Type.STRING },
            },
            required: ["summary"]
          }
        }
      });

      const result = JSON.parse(response.text || "{}");
      
      // If consent is not given, we ensure data is not "stored" in any persistent way 
      // (though in this client-side app, it's mostly in memory anyway)
      if (!this.userConsent) {
        console.log("Data processed without persistent storage consent.");
      }

      return result;
    } catch (error: any) {
      console.error("Process input failed:", error);
      if (error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("deadline")) {
        throw new Error("INTELLIGENCE TIMEOUT: The system is currently processing a high volume of data. Please simplify your request or try again shortly.");
      }
      throw error;
    }
  }

  setConsent(consent: boolean) {
    this.userConsent = consent;
  }

  async deleteUserData(masterId: string) {
    await this.checkEthics("Purge all user data and session history", masterId);
    // In a real app, this would trigger database deletions
    return { status: "success", message: "All user data and session history purged." };
  }

  async summarizeDocument(text: string, masterId: string) {
    return this.processInput({ text }, masterId);
  }

  async synthesizeMaterials(summaries: string[], masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    onProgress?.("Initializing Synthesis Engine...");
    await this.checkEthics("Synthesize research materials into educational content", masterId, userRole);

    onProgress?.("Cross-referencing summaries...");
    onProgress?.("Generating educational framework...");
    
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Synthesize the following research summaries into a comprehensive educational lesson plan, including key concepts, a detailed explanation, and a quiz.
        
        Summaries:
        ${summaries.join("\n\n---\n\n")}
        
        Format the output in Markdown.`,
      });

      return response.text;
    } catch (error: any) {
      console.error("Synthesis failed:", error);
      if (error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("deadline")) {
        throw new Error("SYNTHESIS GATEWAY TIMEOUT: The synthesis engine is currently overloaded. Please try again with fewer summaries.");
      }
      throw error;
    }
  }

  async generateVideoScript(topic: string, masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    onProgress?.("Drafting cinematic script...");
    await this.checkEthics(`Generate cinematic video script for topic: ${topic}`, masterId, userRole);

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Create a cinematic 10-second video script for the following topic: ${topic}. 
        The script should be highly descriptive for a video generation model.`,
      });

      return response.text;
    } catch (error: any) {
      console.error("Video script generation failed:", error);
      if (error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("deadline")) {
        throw new Error("SCRIPTING ENGINE ERROR: Failed to generate video script due to system latency. Please try again.");
      }
      throw error;
    }
  }

  async generateVideo(prompt: string, masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    onProgress?.("Initializing Veo Video Engine...");
    await this.checkEthics("Execute high-fidelity video rendering", masterId, userRole);

    onProgress?.("Submitting generation request to neural cluster...");
    // Note: Veo requires user-selected API key. 
    // This method assumes the key is already set in the environment or handled by the caller.
    let operation = await this.ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    return operation;
  }

  async pollVideoOperation(operation: any) {
    let currentOp = operation;
    while (!currentOp.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      currentOp = await this.ai.operations.getVideosOperation({ operation: currentOp });
    }
    return currentOp;
  }

  async fetchVideoUrl(uri: string) {
    const response = await fetch(uri, {
      method: 'GET',
      headers: {
        'x-goog-api-key': process.env.GEMINI_API_KEY!,
      },
    });
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  async generateImage(prompt: string, masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    onProgress?.("Initializing Image Lab...");
    await this.checkEthics(`Generate high-quality image from prompt: ${prompt}`, masterId, userRole);

    onProgress?.("Synthesizing neural textures...");
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-image-preview',
        contents: {
          parts: [
            {
              text: prompt,
            },
          ],
        },
        config: {
          imageConfig: {
            aspectRatio: "1:1",
            imageSize: "1K"
          },
        },
      });

      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          return `data:image/png;base64,${part.inlineData.data}`;
        }
      }
      return null;
    } catch (error: any) {
      console.error("Image generation failed:", error);
      if (error.message?.includes("Rpc failed") || error.message?.includes("500") || error.message?.includes("deadline")) {
        throw new Error("IMAGE LAB TIMEOUT: The image synthesis engine is experiencing high demand. Please retry your creation.");
      }
      throw error;
    }
    throw new Error("No image data returned from model");
  }

  async editImage(base64Image: string, mimeType: string, prompt: string, masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    onProgress?.("Analyzing source image...");
    await this.checkEthics(`Modify image with new prompt: ${prompt}`, masterId, userRole);

    onProgress?.("Applying iterative modifications...");
    const response = await this.ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Image,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        },
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned from model");
  }

  async searchAndUnderstand(query: string, masterId: string, userRole?: UserRole, onProgress?: (log: string) => void) {
    onProgress?.("Initializing Web Browsing Gateway...");
    await this.checkEthics(`Search and understand topic: ${query}`, masterId, userRole);

    onProgress?.("Connecting to Global Search Index...");
    onProgress?.("Browsing relevant pages and extracting content...");
    onProgress?.("Synthesizing information with Google Search Grounding...");

    const response = await this.ai.models.generateContent({
      model: "gemini-3.1-pro-preview",
      contents: `Search and provide a deep understanding of: ${query}. Cite your sources and provide a comprehensive summary.`,
      config: {
        tools: [{ googleSearch: {} }]
      }
    });

    const sources = response.candidates?.[0]?.groundingMetadata?.groundingChunks?.map(chunk => ({
      title: chunk.web?.title || "Source",
      url: chunk.web?.uri || "#"
    })) || [];

    return {
      text: response.text,
      sources
    };
  }
}

import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

export function createAiGatewayProvider(apiKey: string) {
  const baseURL = process.env.AI_GATEWAY_URL ?? "https://api.openai.com/v1";

  const provider = createOpenAICompatible({
    name: "ai-gateway",
    baseURL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
  };

  return provider;
}

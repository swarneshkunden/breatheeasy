export interface AiClient {
  generate(prompt: string, systemInstruction: string): Promise<string>;
}

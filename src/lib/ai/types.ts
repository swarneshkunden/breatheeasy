export type AiResponse = {
  lowEmission: Array<{ title: string; detail: string; impact: string; score: number }>;
  indoor: Array<{ title: string; detail: string; impact: string; score: number }>;
  sustainable: Array<{ title: string; detail: string; impact: string; score: number }>;
};

export type AiPromptInput = {
  language: string;
  latitude: number;
  longitude: number;
  currentAqi: number;
  pm25: number;
  profile: unknown;
  message: string;
};

export interface AiClient {
  generate(prompt: string): Promise<string>;
}

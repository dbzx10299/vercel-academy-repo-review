import { generateText } from 'ai';
import { z } from 'zod'

export const findingSchema = z.object({
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  category: z.enum(['security', 'quality', 'performance', 'reliability']),
  file: z.string(),
  summary: z.string(),
  recommendation: z.string()
})

export const reviewSchema = z.object({
  overallRisk: z.enum(['low', 'medium', 'high']),
  findings: z.array(findingSchema)
})

export type FindingSchema = z.infer<typeof findingSchema>
export type Review = z.infer<typeof reviewSchema>
 
// existing analyzeWithPromptV1 stays below
export async function analyzeWithPromptV1(source: string): Promise<string> {
  const result = await generateText({
    model: 'openai/gpt-5.3-codex',
    prompt: `Review this code and tell me what is wrong:\n\n${source}`
  });
 
  return result.text;
}

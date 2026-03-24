'use server';
/**
 * @fileOverview An AI content moderation agent.
 *
 * - moderatePostContent - A function that handles the AI-driven content moderation process.
 * - AIChatContentModerationInput - The input type for the moderatePostContent function.
 * - AIChatContentModerationOutput - The return type for the moderatePostContent function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AIChatContentModerationInputSchema = z.object({
  postContent: z.string().describe('The content of the user post to be moderated.'),
});
export type AIChatContentModerationInput = z.infer<typeof AIChatContentModerationInputSchema>;

const AIChatContentModerationOutputSchema = z.object({
  isFlagged: z
    .boolean()
    .describe('True if the content violates community guidelines or contains sensitive keywords, otherwise false.'),
  reason: z
    .string()
    .describe(
      'The reason why the content was flagged, if applicable. Provide specific details about the violation.'
    ),
});
export type AIChatContentModerationOutput = z.infer<typeof AIChatContentModerationOutputSchema>;

export async function moderatePostContent(
  input: AIChatContentModerationInput
): Promise<AIChatContentModerationOutput> {
  return aiChatContentModerationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'aiChatContentModerationPrompt',
  input: { schema: AIChatContentModerationInputSchema },
  output: { schema: AIChatContentModerationOutputSchema },
  prompt: `You are an AI content moderator for Teknoy SafeSpace. Your task is to analyze user-submitted posts and identify any content that violates community guidelines, contains sensitive keywords related to self-harm, or uses inappropriate language.

Community Guidelines include:
- No hate speech or discrimination.
- No harassment or bullying.
- No graphic violence or sexually explicit content.
- No promotion of illegal activities.
- No glorification or encouragement of self-harm.
- No personal attacks or doxxing.
- No spam or irrelevant content.

Sensitive keywords related to self-harm include (but are not limited to): suicide, kill myself, self-harm, cut, overdose, end it all, not worth living, going to hurt myself.

Inappropriate language includes: strong profanity, slurs, sexually suggestive terms not explicitly covered by sexually explicit content.

Analyze the following post content:

Post Content: {{{postContent}}}

Based on your analysis, determine if the post should be flagged. If it should be flagged, provide a clear and concise reason. If not flagged, set 'reason' to an empty string.

Ensure your output matches the following JSON schema.
`,
});

const aiChatContentModerationFlow = ai.defineFlow(
  {
    name: 'aiChatContentModerationFlow',
    inputSchema: AIChatContentModerationInputSchema,
    outputSchema: AIChatContentModerationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

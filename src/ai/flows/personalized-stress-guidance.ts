'use server';
/**
 * @fileOverview This file implements a Genkit flow for providing personalized stress guidance.
 *
 * - personalizeStressGuidance - A function that generates personalized coping strategies and actions.
 * - PersonalizedStressGuidanceInput - The input type for the personalizeStressGuidance function.
 * - PersonalizedStressGuidanceOutput - The return type for the personalizeStressGuidance function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedStressGuidanceInputSchema = z.object({
  stressLevel: z.enum(['Low', 'Moderate', 'High']).describe('The user\u0027s assessed stress level.'),
  assessmentDetails: z
    .string()
    .describe(
      'Brief details or context from the stress assessment, such as main stressors or user concerns.'
    ),
});
export type PersonalizedStressGuidanceInput = z.infer<
  typeof PersonalizedStressGuidanceInputSchema
>;

const PersonalizedStressGuidanceOutputSchema = z.object({
  empatheticMessage: z
    .string()
    .describe(
      'An empathetic and supportive introductory message tailored to the user\u0027s stress level.'
    ),
  copingStrategies: z
    .array(z.string())
    .describe(
      'A list of personalized coping strategies to manage the stress level effectively.'
    ),
  recommendedActions: z
    .array(z.string())
    .describe('A list of actionable steps the user can take to address their stress.'),
});
export type PersonalizedStressGuidanceOutput = z.infer<
  typeof PersonalizedStressGuidanceOutputSchema
>;

export async function personalizeStressGuidance(
  input: PersonalizedStressGuidanceInput
): Promise<PersonalizedStressGuidanceOutput> {
  return personalizedStressGuidanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedStressGuidancePrompt',
  input: {schema: PersonalizedStressGuidanceInputSchema},
  output: {schema: PersonalizedStressGuidanceOutputSchema},
  prompt: `You are an empathetic and supportive AI assistant specializing in mental well-being and stress management.
Your goal is to provide personalized and actionable guidance based on a user's stress assessment.

Based on the following information, generate an empathetic message, coping strategies, and recommended actions:

Stress Level: {{{stressLevel}}}
Assessment Details: {{{assessmentDetails}}}

Ensure your response is compassionate, understanding, and offers practical advice.
Remember to format the output as a JSON object matching the output schema definitions exactly.`, 
});

const personalizedStressGuidanceFlow = ai.defineFlow(
  {
    name: 'personalizedStressGuidanceFlow',
    inputSchema: PersonalizedStressGuidanceInputSchema,
    outputSchema: PersonalizedStressGuidanceOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    if (!output) {
      throw new Error('Failed to generate personalized stress guidance.');
    }
    return output;
  }
);

import { env } from '../config/env';
import { logger } from '../utils/logger';

export const geminiService = {
    async getInsight(prompt: string) {
        if (!env.geminiApiKey) {
            return {
                success: false,
                message: 'Gemini API key is not configured.',
            };
        }

        try {
            const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=' + env.geminiApiKey, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                logger.error('Gemini request failed', { errorText });
                return {
                    success: false,
                    message: 'Unable to call Gemini API.',
                    error: errorText,
                };
            }

            const data = await response.json() as Record<string, unknown>;
            const candidates = Array.isArray((data as Record<string, unknown>).candidates) ? (data as Record<string, unknown>).candidates as Array<Record<string, unknown>> : [];
            const firstCandidate = candidates[0] as Record<string, unknown> | undefined;
            const content = firstCandidate?.content as Record<string, unknown> | undefined;
            const parts = Array.isArray(content?.parts) ? (content?.parts as Array<Record<string, unknown>>) : [];
            const firstPart = parts[0] as Record<string, unknown> | undefined;
            const text = typeof firstPart?.text === 'string' ? firstPart.text : 'No insight returned.';
            return {
                success: true,
                insight: text,
            };
        } catch (error) {
            logger.error('Gemini service error', { error });
            return {
                success: false,
                message: 'Unable to generate AI insight.',
            };
        }
    },
};

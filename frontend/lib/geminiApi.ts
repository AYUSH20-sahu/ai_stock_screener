const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function getGeminiInsight(prompt: string) {
    const response = await fetch(`${API_BASE_URL}/api/gemini/insight?prompt=${encodeURIComponent(prompt)}`);
    if (!response.ok) {
        throw new Error('Unable to load Gemini insight.');
    }
    return response.json();
}

const BASE_PROMPT = `You are a precise knowledge-base synthesizer. Turn a messy speech transcript into a clean, perfectly structured article.

CRITICAL RULES:
1. Preserve the speaker's exact thoughts, meanings, data points, and viewpoints.
2. Correct grammar, fix punctuation errors, repair obvious word errors, and logically reorder ideas into structured readable sections.
3. Do NOT invent new information, inject external examples, or remove unique arguments.
4. Do NOT change the speaker's core opinions.

If any part of the transcript is foggy, heavily contradictory, incomplete, or ambiguous, append a "Questions" section at the end.

Return ONLY valid JSON with this exact shape:
{
  "title": "Clean concise title",
  "cleanArticle": "Polished markdown article text",
  "questions": ["Question 1?", "Question 2?"]
}
If no ambiguities, "questions" is an empty array.`;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript, apiKey, language } = req.body;

  if (!apiKey || !apiKey.startsWith('gsk_')) {
    return res.status(400).json({ error: 'Valid Groq API key (gsk_...) is required' });
  }

  if (!transcript || transcript.trim().length < 5) {
    return res.status(400).json({ error: 'Transcript is too short or empty' });
  }

  const systemPrompt = `${BASE_PROMPT}\n\nThe user spoke in language code: ${language || 'en-US'}. Write the title, article, and questions in the same language as the transcript. If you cannot determine the language, use the language code provided.`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: transcript }
        ],
        temperature: 0.2,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMsg = errorData.error?.message || errorData.error || `Groq API returned ${response.status}`;
      if (response.status === 429) {
        return res.status(429).json({ error: 'Groq rate limit reached. Wait a moment and try again.' });
      }
      return res.status(response.status).json({ error: errorMsg });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'Empty response from Groq' });
    }

    let payload;
    try {
      payload = JSON.parse(content);
    } catch (e) {
      return res.status(500).json({ error: 'Failed to parse Groq response as JSON' });
    }

    return res.status(200).json({
      title: payload.title || 'Untitled Article',
      cleanArticle: payload.cleanArticle || content,
      questions: payload.questions || []
    });

  } catch (err) {
    console.error('Groq proxy error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

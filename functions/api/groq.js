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

export async function onRequest(context) {
  const { request } = context;
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { 'Content-Type': 'application/json' }
    });
  }

  let body;
  try { body = await request.json(); } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  const { transcript, apiKey, language } = body;

  if (!apiKey || !apiKey.startsWith('gsk_')) {
    return new Response(JSON.stringify({ error: 'Valid Groq API key (gsk_...) is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
  }

  if (!transcript || transcript.trim().length < 5) {
    return new Response(JSON.stringify({ error: 'Transcript is too short or empty' }), {
      status: 400, headers: { 'Content-Type': 'application/json' }
    });
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
      const status = response.status === 429 ? 429 : response.status;
      return new Response(JSON.stringify({ error: status === 429 ? 'Groq rate limit reached. Wait a moment and try again.' : errorMsg }), {
        status, headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty response from Groq' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    let payload;
    try { payload = JSON.parse(content); } catch (e) {
      return new Response(JSON.stringify({ error: 'Failed to parse Groq response as JSON' }), {
        status: 500, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      title: payload.title || 'Untitled Article',
      cleanArticle: payload.cleanArticle || content,
      questions: payload.questions || []
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('Groq proxy error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

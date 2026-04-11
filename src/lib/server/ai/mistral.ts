interface MistralResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
}

export async function generateWithMistral(prompt: string): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  const baseUrl = process.env.MISTRAL_BASE_URL || 'https://api.mistral.ai/v1';

  if (!apiKey) {
    throw new Error('MISTRAL_API_KEY is not defined');
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'system',
          content: 'You are a professional social media content creator and tech influencer.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Mistral API Error:', errorBody);
    throw new Error(`Mistral API error: ${response.statusText}`);
  }

  const data: MistralResponse = await response.json();
  return data.choices[0].message.content.trim();
}

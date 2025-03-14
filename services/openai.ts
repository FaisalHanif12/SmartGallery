import { OPENAI_API_KEY } from '@/config/env';

export interface ImageAnalysisResult {
  containsObject: boolean;
  confidence: number;
  description: string;
}

export async function analyzeImage(imageUri: string, searchObject: string): Promise<ImageAnalysisResult> {
  try {
    // Convert image URI to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    // Remove the data URL prefix
    const base64Data = (base64 as string).split(',')[1];

    const response2 = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4-vision-preview",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Does this image contain a ${searchObject}? Answer with a JSON object containing: containsObject (boolean), confidence (number between 0-1), and description (string describing what you see in the image).`
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Data}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    const data = await response2.json();
    const result = JSON.parse(data.choices[0].message.content);
    return result;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
} 
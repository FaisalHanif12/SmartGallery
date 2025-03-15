import { OPENAI_API_KEY } from '@env';

// Function to convert image to base64
const imageToBase64 = async (uri: string): Promise<string> => {
  try {
    // For local URIs, we need to use fetch
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // Extract the base64 data from the result
        const base64String = reader.result?.toString() || '';
        const base64Data = base64String.split(',')[1] || '';
        resolve(base64Data);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert image to base64'));
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error converting image to base64:', error);
    throw new Error('Failed to process image. Please try another image.');
  }
};

/**
 * Sends a question about an image to the OpenAI API and returns the response
 * @param imageUri The URI of the image to analyze
 * @param question The question to ask about the image
 * @returns The AI's response to the question
 */
export const askQuestionAboutImage = async (imageUri: string, question: string): Promise<string> => {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that answers questions about images. Provide accurate, helpful, and concise responses about the visual content of the image. Focus on what you can see in the image and avoid making assumptions about things that are not visible.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: question },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response from OpenAI');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in askQuestionAboutImage:', error);
    throw error;
  }
}; 
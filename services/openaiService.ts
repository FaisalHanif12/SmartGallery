import { Platform } from 'react-native';
import { OPENAI_API_KEY } from '@env';

// Define axios types manually since we can't install the package
interface AxiosResponse {
  data: any;
}

interface AxiosError {
  response?: {
    data: any;
  };
}

// Simple axios implementation for our needs
const axios = {
  post: async (url: string, data: any, config: any): Promise<AxiosResponse> => {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: config.headers,
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      
      return {
        data: await response.json()
      };
    } catch (error) {
      console.error('Fetch error:', error);
      throw error;
    }
  },
  isAxiosError: (error: unknown): error is AxiosError => {
    return error !== null && typeof error === 'object' && 'response' in error;
  }
};

// Fallback function to convert image to base64 using fetch API
export const imageToBase64 = async (uri: string): Promise<string> => {
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

// Function to generate caption using GPT-4o
export const generateImageCaption = async (
  imageBase64: string,
  prompt: string = 'Create an engaging, social media-ready caption for this image. Instead of describing what\'s in the image, capture its mood, emotion, and essence. The caption should be personal, thoughtful, and reflect the feeling or message that the image conveys. It should be something someone would actually post on Instagram or social media - not a description but a meaningful caption that complements the image. Include relevant hashtags if appropriate.'
): Promise<string> => {
  try {
    console.log('Sending request to OpenAI API...');
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a creative social media caption writer who specializes in crafting engaging, meaningful captions that perfectly complement images. You don\'t describe what\'s in the image - instead, you create captions that capture the feeling, mood, or message behind the image. Your captions are the kind that would get lots of engagement on Instagram or other social platforms. They\'re thoughtful, sometimes witty, and always authentic to the image\'s essence.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`
                }
              }
            ]
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        }
      }
    );

    console.log('Response received from OpenAI');
    return response.data.choices[0].message.content;
  } catch (error: unknown) {
    console.error('Error generating caption:', error);
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        console.error('API error details:', axiosError.response.data);
      }
    }
    throw error;
  }
}; 
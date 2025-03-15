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
 * Edits an image based on the provided prompt using OpenAI's DALL-E model
 * @param imageUri The URI of the image to edit
 * @param prompt The editing instructions
 * @returns The URI of the edited image
 */
export const editImageWithAI = async (imageUri: string, prompt: string): Promise<string> => {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Edit this image according to the following instructions: ${prompt}`,
        n: 1,
        size: '1024x1024',
        response_format: 'url',
        quality: 'standard',
        style: 'natural',
        user: 'smartgallery-app',
        image: `data:image/jpeg;base64,${base64Image}`
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response from OpenAI');
    }
    
    // Return the URL of the generated image
    return data.data[0].url;
  } catch (error) {
    console.error('Error in editImageWithAI:', error);
    throw error;
  }
};

/**
 * Continues a conversation about image editing
 * @param imageUri The URI of the image
 * @param conversation The conversation history
 * @param newMessage The new message from the user
 * @returns The AI's response
 */
export const continueImageEditConversation = async (
  imageUri: string, 
  conversation: Array<{role: string, content: any}>, 
  newMessage: string
): Promise<string> => {
  try {
    // Convert image to base64
    const base64Image = await imageToBase64(imageUri);
    
    // Create messages array with conversation history and new message
    const messages = [
      {
        role: 'system',
        content: 'You are an AI assistant that helps with image editing. Provide helpful suggestions and explain how you would edit the image based on the user\'s requests. Be creative, detailed, and focus on visual enhancements.'
      },
      ...conversation,
      {
        role: 'user',
        content: [
          { type: 'text', text: newMessage },
          {
            type: 'image_url',
            image_url: {
              url: `data:image/jpeg;base64,${base64Image}`
            }
          }
        ]
      }
    ];
    
    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'Failed to get response from OpenAI');
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in continueImageEditConversation:', error);
    throw error;
  }
}; 
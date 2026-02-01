// @ts-ignore
import * as Speech from 'expo-speech';
// @ts-ignore
import { Platform } from 'react-native';

class TextToSpeechService {
  private isSpeaking: boolean = false;
  private currentUtteranceId: string | null = null;

  // @ts-ignore
  async speak(text: string, options?: any) {
    try {
      // Cancel any ongoing speech
      if (this.isSpeaking) {
        await this.stop();
      }

      // Add basic validation
      if (!text || typeof text !== 'string') {
        throw new Error('Invalid text provided for speech');
      }

      // Limit content length for performance and security
      if (text.length > 5000) {
        throw new Error('Text too long for speech synthesis');
      }

      // Default options
      const defaultOptions = {
        language: 'de-DE', // German as default for legal content
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0,
        voice: null, // Let system choose default voice
        onDone: () => {
          this.isSpeaking = false;
          this.currentUtteranceId = null;
        },
        onError: (error: any) => {
          console.error('Text-to-speech error:', error);
          this.isSpeaking = false;
          this.currentUtteranceId = null;
        },
        onStart: () => {
          this.isSpeaking = true;
        },
        onBoundary: (boundary: any) => {
          // Handle word/phrase boundaries if needed
        },
        onPause: () => {
          this.isSpeaking = false;
        },
        onResume: () => {
          this.isSpeaking = true;
        },
        onStop: () => {
          this.isSpeaking = false;
          this.currentUtteranceId = null;
        },
        ...options
      };

      // Speak the text
      const utteranceId = await Speech.speak(text, defaultOptions);
      this.currentUtteranceId = utteranceId;
      
      return utteranceId;
    } catch (error) {
      console.error('Error in text-to-speech service:', error);
      throw error;
    }
  }

  // @ts-ignore
  async stop() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
      this.currentUtteranceId = null;
    } catch (error) {
      console.error('Error stopping speech:', error);
      throw error;
    }
  }

  // @ts-ignore
  async pause() {
    try {
      if (this.isSpeaking) {
        await Speech.pause();
        this.isSpeaking = false;
      }
    } catch (error) {
      console.error('Error pausing speech:', error);
      throw error;
    }
  }

  // @ts-ignore
  async resume() {
    try {
      if (!this.isSpeaking && this.currentUtteranceId) {
        await Speech.resume();
        this.isSpeaking = true;
      }
    } catch (error) {
      console.error('Error resuming speech:', error);
      throw error;
    }
  }

  // @ts-ignore
  async isAvailable() {
    try {
      const isAvailable = await Speech.isAvailableAsync();
      return isAvailable;
    } catch (error) {
      console.error('Error checking speech availability:', error);
      return false;
    }
  }

  // @ts-ignore
  async getAvailableVoices() {
    try {
      const voices = await Speech.getAvailableVoicesAsync();
      return voices;
    } catch (error) {
      console.error('Error getting available voices:', error);
      return [];
    }
  }

  // @ts-ignore
  async setDefaultVoice(voiceId: string) {
    try {
      if (!voiceId) {
        throw new Error('Voice ID is required');
      }
      
      // Validate voice exists
      const voices = await this.getAvailableVoices();
      const voiceExists = voices.some(voice => voice.id === voiceId);
      
      if (!voiceExists) {
        throw new Error('Voice not found');
      }
      
      // Set default voice for future speeches
      await Speech.setDefaultVoice(voiceId);
    } catch (error) {
      console.error('Error setting default voice:', error);
      throw error;
    }
  }

  // Get current speaking status
  getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  // Get current utterance ID
  getCurrentUtteranceId(): string | null {
    return this.currentUtteranceId;
  }

  // @ts-ignore
  async getStatus() {
    try {
      const status = await Speech.getStatusAsync();
      return status;
    } catch (error) {
      console.error('Error getting speech status:', error);
      return null;
    }
  }
}

export default new TextToSpeechService();
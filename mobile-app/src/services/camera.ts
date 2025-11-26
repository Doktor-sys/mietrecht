// @ts-ignore
import { Camera } from 'expo-camera';
// @ts-ignore
import * as ImagePicker from 'expo-image-picker';
// @ts-ignore
import * as FileSystem from 'expo-file-system';

export interface CapturedDocument {
  uri: string;
  width: number;
  height: number;
  type: 'photo' | 'document';
  base64?: string;
}

class CameraService {
  // @ts-ignore
  async requestCameraPermission(): Promise<boolean> {
    const { status } = await Camera.requestCameraPermissionsAsync();
    return status === 'granted';
  }

  // @ts-ignore
  async requestMediaLibraryPermission(): Promise<boolean> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  // @ts-ignore
  async takePicture(): Promise<CapturedDocument | null> {
    const hasPermission = await this.requestCameraPermission();
    
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'photo',
    };
  }

  // @ts-ignore
  async scanDocument(): Promise<CapturedDocument | null> {
    const hasPermission = await this.requestCameraPermission();
    
    if (!hasPermission) {
      throw new Error('Camera permission not granted');
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1.0, // High quality for OCR
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'document',
    };
  }

  // @ts-ignore
  async pickFromGallery(): Promise<CapturedDocument | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'photo',
    };
  }

  // @ts-ignore
  async pickDocument(): Promise<CapturedDocument | null> {
    const hasPermission = await this.requestMediaLibraryPermission();
    
    if (!hasPermission) {
      throw new Error('Media library permission not granted');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1.0,
      base64: false,
    });

    if (result.canceled) {
      return null;
    }

    const asset = result.assets[0];
    return {
      uri: asset.uri,
      width: asset.width,
      height: asset.height,
      type: 'document',
    };
  }

  // @ts-ignore
  async getBase64(uri: string): Promise<string> {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      // @ts-ignore
      console.error('Error converting to base64:', error);
      throw error;
    }
  }

  // @ts-ignore
  async compressImage(uri: string, quality: number = 0.7): Promise<string> {
    try {
      const manipResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality,
      });

      if (!manipResult.canceled) {
        return manipResult.assets[0].uri;
      }
      return uri;
    } catch (error) {
      // @ts-ignore
      console.error('Error compressing image:', error);
      return uri;
    }
  }

  // @ts-ignore
  async getFileInfo(uri: string): Promise<any> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info;
    } catch (error) {
      // @ts-ignore
      console.error('Error getting file info:', error);
      throw error;
    }
  }
}

export default new CameraService();

import cameraService from '../../src/services/camera';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';

jest.mock('expo-camera');
jest.mock('expo-image-picker');
jest.mock('expo-file-system');

describe('CameraService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('requestCameraPermission', () => {
    it('should request camera permission', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      const result = await cameraService.requestCameraPermission();
      expect(result).toBe(true);
      expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalled();
    });

    it('should return false if permission denied', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      const result = await cameraService.requestCameraPermission();
      expect(result).toBe(false);
    });
  });

  describe('takePicture', () => {
    it('should take a picture successfully', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file://test.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      });

      const result = await cameraService.takePicture();
      
      expect(result).toEqual({
        uri: 'file://test.jpg',
        width: 1920,
        height: 1080,
        type: 'photo',
      });
    });

    it('should return null if user cancels', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: true,
      });

      const result = await cameraService.takePicture();
      expect(result).toBeNull();
    });

    it('should throw error if permission not granted', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'denied',
      });

      await expect(cameraService.takePicture()).rejects.toThrow(
        'Camera permission not granted'
      );
    });
  });

  describe('scanDocument', () => {
    it('should scan document with high quality', async () => {
      (Camera.requestCameraPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ImagePicker.launchCameraAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file://document.jpg',
            width: 2048,
            height: 1536,
          },
        ],
      });

      const result = await cameraService.scanDocument();
      
      expect(result).toEqual({
        uri: 'file://document.jpg',
        width: 2048,
        height: 1536,
        type: 'document',
      });

      expect(ImagePicker.launchCameraAsync).toHaveBeenCalledWith(
        expect.objectContaining({
          quality: 1.0,
        })
      );
    });
  });

  describe('pickFromGallery', () => {
    it('should pick image from gallery', async () => {
      (ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock).mockResolvedValue({
        status: 'granted',
      });

      (ImagePicker.launchImageLibraryAsync as jest.Mock).mockResolvedValue({
        canceled: false,
        assets: [
          {
            uri: 'file://gallery.jpg',
            width: 1920,
            height: 1080,
          },
        ],
      });

      const result = await cameraService.pickFromGallery();
      
      expect(result).toEqual({
        uri: 'file://gallery.jpg',
        width: 1920,
        height: 1080,
        type: 'photo',
      });
    });
  });
});

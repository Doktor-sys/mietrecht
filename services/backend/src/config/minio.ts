import { Client as MinioClient } from 'minio';
import { config } from './config';
import { logger } from '../utils/logger';

let minioClient: MinioClient | null = null;

export const getMinioClient = (): MinioClient => {
  if (!minioClient) {
    minioClient = new MinioClient({
      endPoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL,
      accessKey: config.minio.accessKey,
      secretKey: config.minio.secretKey
    });

    logger.info('MinIO client initialized', {
      endpoint: config.minio.endpoint,
      port: config.minio.port,
      useSSL: config.minio.useSSL
    });
  }

  return minioClient;
};

export const initializeMinIO = async (): Promise<void> => {
  try {
    const client = getMinioClient();
    const bucketName = config.minio.bucketName;

    // Check if bucket exists
    const bucketExists = await client.bucketExists(bucketName);

    if (!bucketExists) {
      // Create bucket
      await client.makeBucket(bucketName, config.minio.region);
      logger.info('MinIO bucket created', { bucketName });

      // Set bucket policy for private access
      const policy = {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Deny',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${bucketName}/*`]
          }
        ]
      };

      await client.setBucketPolicy(bucketName, JSON.stringify(policy));
      logger.info('MinIO bucket policy set to private', { bucketName });
    } else {
      logger.info('MinIO bucket already exists', { bucketName });
    }
  } catch (error) {
    logger.error('Error initializing MinIO', { error });
    throw error;
  }
};

export const minio = {
  getClient: getMinioClient,
  initialize: initializeMinIO
};

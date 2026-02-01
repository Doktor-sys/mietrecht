"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.minio = exports.initializeMinIO = exports.getMinioClient = void 0;
const minio_1 = require("minio");
const config_1 = require("./config");
const logger_1 = require("../utils/logger");
let minioClient = null;
const getMinioClient = () => {
    if (!minioClient) {
        minioClient = new minio_1.Client({
            endPoint: config_1.config.minio.endpoint,
            port: config_1.config.minio.port,
            useSSL: config_1.config.minio.useSSL,
            accessKey: config_1.config.minio.accessKey,
            secretKey: config_1.config.minio.secretKey
        });
        logger_1.logger.info('MinIO client initialized', {
            endpoint: config_1.config.minio.endpoint,
            port: config_1.config.minio.port,
            useSSL: config_1.config.minio.useSSL
        });
    }
    return minioClient;
};
exports.getMinioClient = getMinioClient;
const initializeMinIO = async () => {
    try {
        const client = (0, exports.getMinioClient)();
        const bucketName = config_1.config.minio.bucketName;
        // Check if bucket exists
        const bucketExists = await client.bucketExists(bucketName);
        if (!bucketExists) {
            // Create bucket
            await client.makeBucket(bucketName, config_1.config.minio.region);
            logger_1.logger.info('MinIO bucket created', { bucketName });
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
            logger_1.logger.info('MinIO bucket policy set to private', { bucketName });
        }
        else {
            logger_1.logger.info('MinIO bucket already exists', { bucketName });
        }
    }
    catch (error) {
        logger_1.logger.error('Error initializing MinIO', { error });
        throw error;
    }
};
exports.initializeMinIO = initializeMinIO;
exports.minio = {
    getClient: exports.getMinioClient,
    initialize: exports.initializeMinIO
};

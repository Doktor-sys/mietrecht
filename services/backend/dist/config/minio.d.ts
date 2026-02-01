import { Client as MinioClient } from 'minio';
export declare const getMinioClient: () => MinioClient;
export declare const initializeMinIO: () => Promise<void>;
export declare const minio: {
    getClient: () => MinioClient;
    initialize: () => Promise<void>;
};

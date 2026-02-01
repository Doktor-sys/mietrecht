export declare class MobileNotificationService {
    private registeredDevices;
    constructor();
    registerDevice(deviceId: string, deviceToken: string, platform: 'ios' | 'android', lawyerId?: string): Promise<void>;
    unregisterDevice(deviceId: string): Promise<void>;
    sendNotification(deviceId: string, title: string, body: string, data?: Record<string, string>): Promise<{
        success: boolean;
        error?: string;
    }>;
    sendBulkNotifications(deviceIds: string[], title: string, body: string, data?: Record<string, string>): Promise<Array<{
        deviceId: string;
        success: boolean;
        error?: string;
    }>>;
    sendNotificationToLawyer(lawyerId: string, title: string, body: string, data?: Record<string, string>): Promise<Array<{
        deviceId: string;
        success: boolean;
        error?: string;
    }>>;
    getRegisteredDevicesCount(): number;
    getLawyerDevices(lawyerId: string): string[];
}
//# sourceMappingURL=MobileNotificationService.d.ts.map
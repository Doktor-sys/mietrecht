import { PrismaClient, MeetingType } from '@prisma/client';
export interface VideoMeetingConfig {
    provider: 'jitsi' | 'zoom' | 'teams';
    roomId: string;
    roomUrl: string;
    password?: string;
    startTime: Date;
    endTime: Date;
}
export interface ConsultationSession {
    bookingId: string;
    meetingType: MeetingType;
    meetingConfig?: VideoMeetingConfig;
    status: 'scheduled' | 'active' | 'completed' | 'cancelled';
    startedAt?: Date;
    endedAt?: Date;
}
export declare class ConsultationService {
    private prisma;
    constructor(prisma: PrismaClient);
    /**
     * Erstellt eine Video-Meeting-Konfiguration für eine Buchung
     */
    createVideoMeeting(bookingId: string, provider?: 'jitsi' | 'zoom' | 'teams'): Promise<VideoMeetingConfig>;
    /**
     * Generiert Meeting-Konfiguration basierend auf Provider
     */
    private generateMeetingConfig;
    /**
     * Generiert eindeutige Room-ID
     */
    private generateRoomId;
    /**
     * Generiert sicheres Meeting-Passwort
     */
    private generateMeetingPassword;
    /**
     * Holt Video-Meeting-Details für eine Buchung
     */
    getVideoMeeting(bookingId: string, userId: string): Promise<VideoMeetingConfig | null>;
    /**
     * Startet eine Konsultations-Session
     */
    startConsultation(bookingId: string, userId: string): Promise<ConsultationSession>;
    /**
     * Beendet eine Konsultations-Session
     */
    endConsultation(bookingId: string, userId: string, notes?: string): Promise<void>;
    /**
     * Überträgt verschlüsselte Falldaten an Anwalt
     */
    transferSecureCaseData(bookingId: string, userId: string, caseId: string): Promise<void>;
    /**
     * Holt übertragene Falldaten für Anwalt
     */
    getCaseDataForLawyer(bookingId: string, lawyerId: string): Promise<any>;
}

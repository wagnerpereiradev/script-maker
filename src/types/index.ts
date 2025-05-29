export interface ProspectData {
    contactName: string;
    companyName: string;
    niche: string;
    position?: string;
    email?: string;
    phone?: string;
    website?: string;
    painPoints?: string;
    previousInteraction?: string;
    notes?: string;
}

export interface EmailScript {
    id: string;
    subject: string;
    body: string;
    prospectData: ProspectData;
    createdAt: Date;
    updatedAt: Date;
}

export interface ScriptGenerationRequest {
    prospectData: ProspectData;
    emailType: 'cold_outreach' | 'follow_up' | 'introduction' | 'meeting_request';
    tone: 'professional' | 'casual' | 'friendly' | 'formal';
    length: 'short' | 'medium' | 'long';
    callToAction: string;
    customInstructions?: string;
} 
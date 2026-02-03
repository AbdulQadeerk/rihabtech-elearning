import apiClient from './axiosInterceptor';

export interface Certificate {
  id: number;
  userId: number;
  courseId: number;
  certificateNumber: string;
  verificationCode: string;
  learnerName: string;
  learnerEmail: string;
  courseTitle: string;
  courseCategory?: string;
  courseSubCategory?: string;
  instructorId: number;
  instructorName: string;
  completionDate: Date;
  issuedDate: Date;
  status: string;
  templateId?: number;
  templateName?: string;
  pdfUrl?: string;
  imageUrl?: string;
  isDownloaded: boolean;
  downloadCount: number;
  lastDownloadedAt?: Date;
  validUntil?: Date;
  issuerName: string;
  issuerLogo?: string;
  metadata?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface GenerateCertificatePayload {
  courseId: number;
  templateId?: number;
}

export const certificateApiService = {
  getCertificate: async (certificateId: number): Promise<Certificate> => {
    const response = await apiClient.get<Certificate>(`/certificate/${certificateId}`);
    const cert = response.data;
    return {
      ...cert,
      completionDate: new Date(cert.completionDate),
      issuedDate: new Date(cert.issuedDate),
      createdAt: new Date(cert.createdAt),
      updatedAt: new Date(cert.updatedAt),
      lastDownloadedAt: cert.lastDownloadedAt ? new Date(cert.lastDownloadedAt) : undefined,
      validUntil: cert.validUntil ? new Date(cert.validUntil) : undefined,
    };
  },

  getCertificateByCourse: async (courseId: number): Promise<Certificate | null> => {
    try {
      const response = await apiClient.get<Certificate>(`/certificate/course/${courseId}`);
      const cert = response.data;
      return {
        ...cert,
        completionDate: new Date(cert.completionDate),
        issuedDate: new Date(cert.issuedDate),
        createdAt: new Date(cert.createdAt),
        updatedAt: new Date(cert.updatedAt),
        lastDownloadedAt: cert.lastDownloadedAt ? new Date(cert.lastDownloadedAt) : undefined,
        validUntil: cert.validUntil ? new Date(cert.validUntil) : undefined,
      };
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  },

  getMyCertificates: async (): Promise<Certificate[]> => {
    const response = await apiClient.get<Certificate[]>('/certificate/my-certificates');
    return response.data.map((cert: Certificate) => ({
      ...cert,
      completionDate: new Date(cert.completionDate),
      issuedDate: new Date(cert.issuedDate),
      createdAt: new Date(cert.createdAt),
      updatedAt: new Date(cert.updatedAt),
      lastDownloadedAt: cert.lastDownloadedAt ? new Date(cert.lastDownloadedAt) : undefined,
      validUntil: cert.validUntil ? new Date(cert.validUntil) : undefined,
    }));
  },

  generateCertificate: async (payload: GenerateCertificatePayload): Promise<Certificate> => {
    const response = await apiClient.post<Certificate>('/certificate/generate', payload);
    const cert = response.data;
    return {
      ...cert,
      completionDate: new Date(cert.completionDate),
      issuedDate: new Date(cert.issuedDate),
      createdAt: new Date(cert.createdAt),
      updatedAt: new Date(cert.updatedAt),
      lastDownloadedAt: cert.lastDownloadedAt ? new Date(cert.lastDownloadedAt) : undefined,
      validUntil: cert.validUntil ? new Date(cert.validUntil) : undefined,
    };
  },

  downloadCertificate: async (certificateId: number): Promise<Certificate> => {
    const response = await apiClient.post<Certificate>(`/certificate/${certificateId}/download`);
    const cert = response.data;
    return {
      ...cert,
      completionDate: new Date(cert.completionDate),
      issuedDate: new Date(cert.issuedDate),
      createdAt: new Date(cert.createdAt),
      updatedAt: new Date(cert.updatedAt),
      lastDownloadedAt: cert.lastDownloadedAt ? new Date(cert.lastDownloadedAt) : undefined,
      validUntil: cert.validUntil ? new Date(cert.validUntil) : undefined,
    };
  },
};


export interface NotificationState {
    text: string;
    type: 'success' | 'error';
}

export interface StoProfile {
    id: number;
    stationName: string;
    region: string;
    city: string;
    address: string;
    description?: string;
    serviceTypes: string[];
}

export interface AdminProfile {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    stoProfile?: StoProfile;
}

export interface Vehicle {
    id: number;
    vin: string;
    brand: string;
    model: string;
    year: number;
    vehicleType: string;
    mileage: number;
    number?: string;
    owner?: { email: string };
    blockchainTxHash?: string;
}

export interface StatusHistory {
    status: string;
    changedAt: string;
    blockchainTxHash?: string;
}

export interface ServiceRequest {
    id: number;
    blockchainJobId?: string;
    status: string;
    mileage: number;
    createdAt: string;
    description: string;
    totalAmount?: number;
    depositAmount?: number;
    workTypes: string[];
    vehicle?: Vehicle;
    stoId: number;
    statusHistory?: StatusHistory[];
    pdfHash?: string;
    workReportPdfHash?: string;
    inspectionPdfHash?: string;
    paymentReceiptPdfHash?: string;
}

export interface IntegrityResult {
    valid: boolean;
    message: string;
    originalBlockchainHash?: string;
    currentFileHash?: string;
}
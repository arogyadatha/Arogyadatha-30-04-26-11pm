export type UserRole = 'patient' | 'doctor' | 'hospital' | 'lab' | 'pharmacy' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  role: UserRole;
  phoneNumber: string;
  arogyadathaId: string;
  createdAt: any;
  
  // Patient specific
  dob?: string;
  
  // Doctor specific
  experience?: string;
  registrationNumber?: string;
  specialization?: string;
  qualification?: string;
  doctorType?: 'hospital' | 'independent';
  availability?: {
    days: string[];
    startTime: string;
    endTime: string;
    status: 'Available' | 'On Leave';
  };
  rating?: number;
  focus?: string;
  surgeries?: string;
  mode?: 'Online' | 'Offline' | 'Both';
  consultationFee?: number;
  profileImage?: string;
  
  // Lab/Pharmacy specific
  address?: string;
  city?: string;
  state?: string;
  licenseNumber?: string;
  labName?: string;
  pharmacyName?: string;
}

export interface Appointment {
  id: string;
  path?: string;
  patientId: string;
  patientName: string;
  doctorId: string;
  doctorName?: string;
  doctorSpecialty?: string;
  caseId: string;
  type: 'Online' | 'Offline';
  dateTime: any;
  status: 'Pending' | 'Completed';
  prescription?: string;
  opNumber?: string;
  revenue: number;
}

export interface MedicinePrescription {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: {
    morning: boolean;
    afternoon: boolean;
    night: boolean;
  };
  food: 'before' | 'after';
  duration: string;
  createdAt: any;
}

export interface Case {
  id: string;
  caseId: string;
  userId: string;
  caseName: string;
  symptoms: string;
  diagnosis?: string;
  doctorName?: string;
  createdAt: any;
  status: 'active' | 'completed' | 'cancelled';
  currentStage: 'appointment' | 'tests_pending' | 'reports_uploaded' | 'medicines_prescribed' | 'completed';
  healthJourney: {
    symptomChecker: boolean;
    bookDoctor: boolean;
    bookLab: boolean;
    pharmacy: boolean;
    manualLab?: boolean;
    manualPharmacy?: boolean;
  };
  vitals?: {
    bp: string;
    weight: string;
    height: string;
  };
  followUpNote?: string;
  lastFollowUpStartedAt?: any;
  symptomsUpdatedAt?: any;
  labRequests?: Array<{
    tests: string[];
    status: 'Pending' | 'Completed';
    reportUrl?: string;
    visibleToDoctor: boolean;
    doctorId: string;
    createdAt: any;
  }>;
  medicines?: MedicinePrescription[];
  appointments?: Appointment[];
    sessionHistory?: Array<{
      followUpNum: number;
      completedAt: any;
      symptoms: string;
      vitals?: {
        bp: string;
        weight: string;
        height: string;
      };
      medicines: MedicinePrescription[];
      labRequests: any[];
      healthJourney: any;
      diagnosis?: string;
      doctorName?: string;
      followUpNote?: string;
    }>;
  followUp?: {
    date: any;
    status: 'pending' | 'completed';
    note?: string;
  };
}

export type CaseData = Case;

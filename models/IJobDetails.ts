export type ExperienceLevel = 'Manager' | 'Senior' | 'Lead' | 'Mid-Level' | 'Junior' | 'Student';
export type JobType = 'Full-time' | 'Contract' | 'Internship';

export interface IJobDetails {
    jobId: number;
    companyName: string;
    companyUrl?: string;
    salary?: string;
    remote?: string;
    remoteDetails?: string;
    isEquityIncluded: boolean;
    isVisaSponsored: boolean;
    isPaidRelocation: boolean;
    jobType?: JobType;
    experienceLevel?: Set<ExperienceLevel>;
    role?: string;
    industry?: string;
    companySize?: string;
    companyType?: string;
    technologies: string[];
    description: string;
    aboutCompany?: string;
    joelTest?: { [key: string]: boolean };
    imageUrl?: string;
}

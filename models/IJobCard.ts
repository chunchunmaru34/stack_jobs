export interface IJobCard {
    jobId: number;
    jobTitle: string;
    detailUrl: string;
    companyName: string;
    companyLocation: string;
    imageUrl?: string;
    technologies: string[];
    salary?: string;
    remote?: string;
    isEquityIncluded: boolean;
    isVisaSponsored: boolean;
    isPaidRelocation: boolean;
}

export interface IJobCardClosed extends IJobCard {
    dateClosed: string;
}

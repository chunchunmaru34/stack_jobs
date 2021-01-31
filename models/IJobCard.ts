interface IJobCard {
    jobId: number;
    jobTitle: string;
    detailUrl: string;
    companyName: string;
    companyLocation: string;
    imageUrl?: string;
    technologies: string[];
    salary?: string;
    remote?: string;
}

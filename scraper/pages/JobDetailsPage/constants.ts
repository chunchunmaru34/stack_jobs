export enum SECTIONS {
    ABOUT_JOB = 'About this job',
    TECHNOLOGIES = 'Technologies',
    JOB_DESCRIPTION = 'Job description',
    REMOTE_DETAILS = 'Remote details',
    JOEL_TEST = 'Joel Test',
    BENEFITS = 'Benefits',
    ABOUT_COMPANY_SECTION = 'About ${companyName}',
}

export const MandatorySections = <const>[SECTIONS.ABOUT_JOB, SECTIONS.TECHNOLOGIES, SECTIONS.JOB_DESCRIPTION];
export const OptionalSections = <const>[
    SECTIONS.REMOTE_DETAILS,
    SECTIONS.BENEFITS,
    SECTIONS.JOEL_TEST,
    SECTIONS.ABOUT_COMPANY_SECTION,
];

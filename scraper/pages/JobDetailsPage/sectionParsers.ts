import { ElementHandle } from 'puppeteer';

import { ExperienceLevel, IJobDetails } from '@models/IJobDetails';
import { toInnerText } from '@utils/puppeteer';

import { SECTIONS } from './constants';
import { PageSections } from './types';

export const parsersBySection = {
    [SECTIONS.ABOUT_JOB]: parseAboutSection,
    [SECTIONS.TECHNOLOGIES]: parseTechnologiesSection,
    [SECTIONS.JOB_DESCRIPTION]: parseJobDescriptionSection,
    [SECTIONS.REMOTE_DETAILS]: parseRemoteDetailsSections,
    [SECTIONS.JOEL_TEST]: parseJoelTestSection,
    [SECTIONS.BENEFITS]: parseBenefitsSection,
    [SECTIONS.ABOUT_COMPANY_SECTION]: parseAboutCompanySection,
};

export async function parseAboutSection(section: ElementHandle) {
    const lines = await section.$$('.mb8');
    const keyValuePairs = await Promise.all(
        lines.map((line) => line.$$('span').then((spans) => Promise.all(spans.map(toInnerText))))
    );

    const lineMap = keyValuePairs.reduce((acc, [key, value]) => {
        acc[key.trim().replace(/:/g, '')] = value.trim();
        return acc;
    }, {} as { [key: string]: string });

    const lineTitles = ['Job type', 'Experience level', 'Role', 'Industry', 'Company size', 'Company type'];

    const [jobType, experienceLevel, role, industry, companySize, companyType] = lineTitles.map(
        (title) => lineMap[title]
    );

    return {
        jobType,
        experienceLevel: experienceLevel && new Set(experienceLevel.split(', ') as ExperienceLevel[]),
        role,
        industry,
        companySize,
        companyType,
    };
}

export async function parseTechnologiesSection(section: ElementHandle) {
    const links = await section.$$('a');
    const techs = await Promise.all(links.map((link) => toInnerText(link)));

    return { technologies: techs };
}

export async function parseJobDescriptionSection(section: ElementHandle) {
    const description = await section.$('div').then(toInnerText);
    return { description };
}

export async function parseAboutCompanySection(section: ElementHandle) {
    const aboutCompany = await section.$('div').then(toInnerText);
    return { aboutCompany };
}

export async function parseRemoteDetailsSections(section: ElementHandle) {
    const remoteDetails = await section.$('div').then(toInnerText);
    return { remoteDetails };
}

export async function parseJoelTestSection(section: ElementHandle) {
    const lines = await section.$$('.mb4');

    const tuples = await Promise.all(
        lines.map((line) => Promise.all([toInnerText(line), line.$('.iconCheckmark').then(Boolean)]))
    );

    return { joelTest: Object.fromEntries(tuples) };
}

export async function parseBenefitsSection(section: ElementHandle) {
    const benefits = await section.$$('ul > li').then((items) => Promise.all(items.map(toInnerText)));

    return { benefits };
}

export async function mapSectionsToJobDetails(sections: PageSections): Promise<Partial<IJobDetails>> {
    const mandatorySectionsData: Promise<Partial<IJobDetails>>[] = Object.entries(
        sections.mandatorySections
    ).reduce((acc, [sectionKey, element]) => {
        const handler = parsersBySection[sectionKey as keyof PageSections['mandatorySections']];

        if (!handler) {
            console.warn(`No parser found for section ${sectionKey}`);
            return acc;
        }

        const promise = handler(element);

        return acc.concat(promise);
    }, []);

    const optionalSectionsData: Promise<Partial<IJobDetails>>[] = Object.entries(
        sections.optionalSections
    ).reduce((acc, [sectionKey, element]) => {
        if (element.isNone) {
            return acc;
        }

        const handler = parsersBySection[sectionKey as keyof PageSections['mandatorySections']];

        if (!handler) {
            console.warn(`No parser found for section ${sectionKey}`);
            return acc;
        }

        const promise = handler(element.getValue());

        return acc.concat(promise);
    }, []);

    const partials = await Promise.all([...optionalSectionsData, ...mandatorySectionsData]);

    const data = partials.reduce((acc, item) => ({ ...acc, ...item }), {});

    return data;
}

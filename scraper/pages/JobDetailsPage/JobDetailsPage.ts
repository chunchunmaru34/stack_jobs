import { ElementHandle, Page } from 'puppeteer';

import { Maybe } from '@models/util/Maybe';
import { getPropertyValue } from '@utils/puppeteer';

const NOT_FOUND_DEFAULT_STRING = '-';

enum SECTIONS {
    ABOUT_JOB = 'About this job',
    TECHNOLOGIES = 'Technologies',
    JOB_DESCRIPTION = 'Job description',
    REMOTE_DETAILS = 'Remote details',
    JOEL_TEST = 'Joel Test',
}

const toInnerText = async (element: ElementHandle) => getPropertyValue('innerText')(element);

const identity = <T>(value: T) => value;

export class JobDetailsPage {
    page: Page;

    handlersBySection = {
        [SECTIONS.ABOUT_JOB]: this.parseAboutSection,
        [SECTIONS.JOB_DESCRIPTION]: this.parseJobDescriptionSection,
        [SECTIONS.TECHNOLOGIES]: this.parseTechnologiesSection,
    };

    constructor(page: Page) {
        this.page = page;
    }

    async parseHeader(header: ElementHandle) {
        const companyLink = Maybe.of(await header.$('a.employer')).valueOrDefault(
            Maybe.of(await header.$('h1 + div > a')).valueOrThrow('Could not find company link')
        );

        const companyUrl = await getPropertyValue('href')(companyLink);
        const companyName = await toInnerText(companyLink);

        const companyInfo = {
            url: companyUrl,
            name: companyName,
        };

        const withMaybe = (val: ElementHandle) =>
            Maybe.of(val).map(toInnerText).valueOrDefault(Promise.resolve(NOT_FOUND_DEFAULT_STRING));

        const [salary, remote, sponsoredVisa] = await Promise.all(
            ['span.-salary', 'span.-remote', 'span.-visa'].map((selector) =>
                header.$(selector).then(withMaybe)
            )
        );

        return { companyInfo, salary, remote, sponsoredVisa };
    }

    async parseAboutSection(section: ElementHandle) {
        const lines = await section.$$('.mb8');
        const keyValuePairs = await Promise.all(
            lines.map((line) => line.$$('span').then((spans) => Promise.all(spans.map(toInnerText))))
        );

        const lineMap = keyValuePairs.reduce((acc, [key, value]) => {
            acc[key.trim().replace(/:/g, '')] = value.trim();
            return acc;
        }, {});

        const lineTitles = [
            'Job type',
            'Experience level',
            'Role',
            'Industry',
            'Company size',
            'Company type',
        ];

        const [jobType, experienceLevel, role, industry, companySize, companyType] = lineTitles.map(
            (title) => lineMap[title]
        );

        return {
            jobType,
            experienceLevel,
            role,
            industry,
            companySize,
            companyType,
        };
    }

    async parseTechnologiesSection(section: ElementHandle) {
        const links = await section.$$('a');
        const tuples = await Promise.all(
            links.map((link) => Promise.all([getPropertyValue('href')(link), toInnerText(link)]))
        );

        return tuples.map(([url, name]) => ({ url, name }));
    }

    async parseJobDescriptionSection(section: ElementHandle) {
        return section.$('div').then(toInnerText);
    }

    async parseAboutCompanySection(section: ElementHandle) {
        return section.$('div').then(toInnerText);
    }

    async parseJoelTestSection(section: ElementHandle) {
        const lines = await section.$$('.mb4');

        const tuples = await Promise.all(
            lines.map((line) => Promise.all([line.$('.iconCheckmark').then(Boolean), toInnerText(line)]))
        );

        return tuples.map(([isChecked, title]) => ({
            title,
            isChecked,
        }));
    }

    async getDetailsSections(mainContainer: ElementHandle, companyName: string) {
        const sectionElements = await mainContainer.$$('section');

        const getSectionTitle = async (el: ElementHandle) =>
            Maybe.of(await el.$('h2'))
                .map(toInnerText)
                .valueOrDefault(Promise.resolve(''));

        const sections = (await Promise.all(sectionElements.map((s) => Promise.all([getSectionTitle(s), s]))))
            .filter(([title]) => !!title)
            .map(([title, el]) => ({
                title,
                el,
            }));

        const [aboutSection, jobDescriptionSection, technologiesSection] = [
            SECTIONS.ABOUT_JOB,
            SECTIONS.JOB_DESCRIPTION,
            SECTIONS.TECHNOLOGIES,
        ]
            .map((sectionTitle) =>
                Maybe.of(sections.find((s) => s.title === sectionTitle)).valueOrThrow(
                    `Could not find section ${sectionTitle}`
                )
            )
            .map((section) => section.el);

        const aboutCompanySection = sections.find(
            (s) => s.title.includes('About') && s.title.includes(companyName)
        ).el;

        const joelTestSection = Maybe.of(sections.find((s) => s.title === SECTIONS.JOEL_TEST)?.el);

        return {
            aboutSection,
            jobDescriptionSection,
            technologiesSection,
            aboutCompanySection,
            joelTestSection,
        };
    }

    async getJobInfo() {
        const mainContainer = Maybe.of(await this.page.$('#mainbar')).valueOrThrow('No main container found');

        const header = Maybe.of(await mainContainer.$('header')).valueOrThrow('No job header found');
        const headerInfo = await this.parseHeader(header);

        const {
            aboutSection,
            technologiesSection,
            jobDescriptionSection,
            joelTestSection,
            aboutCompanySection,
        } = await this.getDetailsSections(mainContainer, headerInfo.companyInfo.name);

        const aboutInfo = await this.parseAboutSection(aboutSection);
        const techInfo = await this.parseTechnologiesSection(technologiesSection);
        const description = await this.parseJobDescriptionSection(jobDescriptionSection);
        const joelTest = await joelTestSection
            .map(this.parseJoelTestSection)
            .valueOrDefault(Promise.resolve([]));
        const aboutCompany = await this.parseAboutCompanySection(aboutCompanySection);

        return {
            headerInfo,
            aboutInfo,
            techInfo,
            description,
            joelTest,
            aboutCompany,
        };
    }
}

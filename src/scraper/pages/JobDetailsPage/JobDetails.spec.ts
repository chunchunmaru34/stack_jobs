import * as R from 'ramda';

import { IJobCard } from '@models/IJobCard';
import { promiseQueue, timer } from '@utils/async';
import { ValuesOf } from '@models/util';

import { JobSearchPage } from './../JobSearchPage/JobSearchPage';
import { JobDetailsPage } from './JobDetailsPage';
import { parsersBySection } from './sectionParsers';
import { OptionalSections, SECTIONS } from './constants';
import { PageSections } from './types';

describe('Job Details Page', () => {
    const jobPage = new JobDetailsPage(page);
    const jobSearch = new JobSearchPage(page);

    let jobCards: IJobCard[];

    beforeAll(async () => {
        jobCards = await jobSearch.getJobCardsForPage(1);
    });

    test('it should load the page', async () => {
        await jobPage.loadPageFor(jobCards[0]);
    });

    test('it should locate main container', async () => {
        await jobPage.loadPageFor(jobCards[0]);

        const mainContainer = await jobPage.getMainContainer();

        expect(mainContainer).toBeTruthy();
    });

    test('it should locate header', async () => {
        await jobPage.loadPageFor(jobCards[0]);

        const mainContainer = await jobPage.getMainContainer();
        const header = await jobPage.getHeader(mainContainer);

        expect(header).toBeTruthy();
    });

    test('it should parse header', async () => {
        await jobPage.loadPageFor(jobCards[0]);

        const mainContainer = await jobPage.getMainContainer();
        const header = await jobPage.getHeader(mainContainer);

        const headerInfo = await jobPage.parseHeader(header);

        expect(headerInfo).toBeTruthy();
        expect(headerInfo).toHaveProperty('companyName');
    });

    test('it should find mandatory sections', async () => {
        await jobPage.loadPageFor(jobCards[0]);

        const mainContainer = await jobPage.getMainContainer();
        const header = await jobPage.getHeader(mainContainer);
        const headerInfo = await jobPage.parseHeader(header);

        const sections = await jobPage.getDetailsSections(mainContainer, headerInfo.companyName);

        const isAllSectionsFound = Object.values(sections.mandatorySections).every(Boolean);

        expect(isAllSectionsFound).toBe(true);
    });

    describe('sections', () => {
        let mainContainer;
        let header;
        let headerInfo;
        let sections: PageSections;

        const initDataForCard = async (card: IJobCard) => {
            await jobPage.loadPageFor(card);

            mainContainer = await jobPage.getMainContainer();
            header = await jobPage.getHeader(mainContainer);
            headerInfo = await jobPage.parseHeader(header);
            sections = await jobPage.getDetailsSections(mainContainer, headerInfo.companyName);
        };

        beforeAll(async () => {
            await initDataForCard(jobCards[0]);
        });

        describe.only('mandatory', () => {
            it('should parse "About" section', async () => {
                const sectionData = await parsersBySection[SECTIONS.ABOUT_JOB](
                    sections.mandatorySections[SECTIONS.ABOUT_JOB]
                );

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('jobType');
            });

            it('should parse "Technologies" section', async () => {
                const sectionData = await parsersBySection[SECTIONS.TECHNOLOGIES](
                    sections.mandatorySections[SECTIONS.TECHNOLOGIES]
                );

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('technologies');
            });

            it('should parse "Description" section', async () => {
                const sectionData = await parsersBySection[SECTIONS.JOB_DESCRIPTION](
                    sections.mandatorySections[SECTIONS.JOB_DESCRIPTION]
                );

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('description');
            });
        });

        describe('try optional', () => {
            const tryToGetSection = async (sectionType: ValuesOf<typeof OptionalSections>) => {
                let section = sections.optionalSections[sectionType];

                let currentTry = 0;
                while (section.isNone && currentTry < jobCards.length) {
                    await timer(1000);

                    currentTry = R.inc(currentTry);

                    await initDataForCard(jobCards[currentTry]);

                    section = sections.optionalSections[sectionType];
                }

                return section;
            };

            it(`should parse "About company" section when it exists`, async () => {
                const section = await tryToGetSection(SECTIONS.ABOUT_COMPANY_SECTION);

                if (section.isNone) {
                    return;
                }

                const sectionData = await parsersBySection[SECTIONS.ABOUT_COMPANY_SECTION](
                    section.getValue()
                );

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('aboutCompany');
                expect(sectionData.aboutCompany.length).toBeGreaterThan(0);
            }, 60000);

            it(`should parse "Joel test" section when it exists`, async () => {
                const section = await tryToGetSection(SECTIONS.JOEL_TEST);

                if (section.isNone) {
                    return;
                }

                const sectionData = await parsersBySection[SECTIONS.JOEL_TEST](section.getValue());

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('joelTest');
                expect(Object.values(sectionData.joelTest).length).toBeGreaterThan(0);
                expect(Object.values(sectionData.joelTest).some(Boolean)).toBe(true);
            }, 60000);

            it(`should parse "Benefits" section when it exists`, async () => {
                const section = await tryToGetSection(SECTIONS.BENEFITS);

                if (section.isNone) {
                    return;
                }

                const sectionData = await parsersBySection[SECTIONS.BENEFITS](section.getValue());

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('benefits');
                expect(sectionData.benefits.length).toBeGreaterThan(0);
                expect(sectionData.benefits.every(Boolean)).toBe(true);
            }, 60000);

            it(`should parse Remote Details" section when it exists`, async () => {
                const section = await tryToGetSection(SECTIONS.REMOTE_DETAILS);

                if (section.isNone) {
                    return;
                }

                const sectionData = await parsersBySection[SECTIONS.REMOTE_DETAILS](section.getValue());

                expect(sectionData).toBeTruthy();
                expect(sectionData).toHaveProperty('remoteDetails');
                expect(sectionData.remoteDetails).toBeTruthy();
            }, 60000);
        });
    });

    test('it should get job details', async () => {
        const jobDetails = await jobPage.getJobDetailsFor(jobCards[0]);

        expect(jobDetails).toBeTruthy();

        expect(jobDetails).toHaveProperty('jobId');
        expect(jobDetails).toHaveProperty('companyName');
        expect(jobDetails).toHaveProperty('isEquityIncluded');
        expect(jobDetails).toHaveProperty('isVisaSponsored');
        expect(jobDetails).toHaveProperty('isPaidRelocation');
        expect(jobDetails).toHaveProperty('technologies');
        expect(jobDetails).toHaveProperty('description');
    });

    test('it should get the job details for all kinds of jobs', async () => {
        const MAX_CARDS_FOR_TEST = 12;

        const tasks = jobCards
            .slice(0, MAX_CARDS_FOR_TEST)
            .map((card) => () => jobPage.getJobDetailsFor(card));

        const result = await promiseQueue(1500, tasks);

        expect(result.length).toBe(MAX_CARDS_FOR_TEST);

        const isAllTruthy = !result.map(Boolean).some(R.not);
        expect(isAllTruthy).toBe(true);
    }, 100000);
});

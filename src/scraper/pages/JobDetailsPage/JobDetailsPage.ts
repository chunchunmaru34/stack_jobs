import { IJobCard } from '@models/IJobCard';
import { ElementHandle, Page } from 'puppeteer';

import { Maybe } from '@models/util/Maybe';
import { getPropertyValue, toInnerText } from '@utils/puppeteer';
import * as R from 'ramda';
import { IJobDetails } from '@models/IJobDetails';

import { MandatorySections, SECTIONS, OptionalSections } from './constants';
import { PageSections } from './types';
import { mapSectionsToJobDetails } from './sectionParsers';
import { salaryRange } from '@constants/regex';
import { ValuesOf } from '@models/util';

const getSectionTitle = async (el: ElementHandle) =>
    Maybe.of(await el.$('h2'))
        .map(toInnerText)
        .valueOrDefault(Promise.resolve(''));

export class JobDetailsPage {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async loadPageFor(jobCard: IJobCard) {
        await this.page.goto(jobCard.detailUrl, {
            waitUntil: 'networkidle2',
        });
    }

    async getMainContainer() {
        const mainContainer = Maybe.of(await this.page.$('#content')).valueOrThrow('No main container found');

        return mainContainer;
    }

    async getHeader(mainContainer: ElementHandle<Element>) {
        const header = Maybe.of(await mainContainer.$('header')).valueOrThrow('No job header found');

        return header;
    }

    async parseHeader(header: ElementHandle) {
        const companyLink = Maybe.of(await header.$('a.employer')).valueOrDefault(
            Maybe.of(await header.$('h1 + div > a')).valueOrThrow('Could not find company link')
        );

        const companyUrl = await getPropertyValue('href')(companyLink);
        const companyName = await toInnerText(companyLink);

        const tagLike = await header
            .$$('ul > li > span')
            .then((items) => Promise.all(items.map(toInnerText)));

        const salary = tagLike.find((item) => item.match(salaryRange));
        const remote = tagLike.find((item) => item.toLowerCase().includes('remote'));
        const isVisaSponsored = tagLike.some((item) => item.toLowerCase().includes('visa'));
        const isPaidRelocation = tagLike.some((item) => item.toLowerCase().includes('relocation'));
        const isEquityIncluded = tagLike.some((item) => item.toLowerCase().includes('equity'));

        return {
            companyUrl,
            companyName,
            salary,
            remote,
            isVisaSponsored,
            isPaidRelocation,
            isEquityIncluded,
        };
    }

    async getDetailsSections(mainContainer: ElementHandle, companyName: string) {
        const sectionElements = await mainContainer.$$('section');

        const sections = (
            await Promise.all(sectionElements.map((s) => Promise.all([getSectionTitle(s), s])))
        ).filter(([title]) => !!title);

        const findSection = (title: string) => sections.find(([parsedTitle]) => parsedTitle === title);
        const safeFindSection = (title: string) =>
            Maybe.of(findSection(title)).valueOrThrow(`Could not find section ${title}`);

        const mandatorySections: [
            ValuesOf<typeof MandatorySections>,
            ElementHandle<Element>
        ][] = MandatorySections.map((sectionTitle) => [sectionTitle, safeFindSection(sectionTitle)[1]]);

        const optionalSections: [
            ValuesOf<typeof OptionalSections>,
            Maybe<ElementHandle<Element>>
        ][] = OptionalSections.filter(
            (section) => section !== SECTIONS.ABOUT_COMPANY_SECTION
        ).map((title) => [title, Maybe.of(findSection(title)).map(R.prop('1'))]);

        optionalSections.push([
            SECTIONS.ABOUT_COMPANY_SECTION,
            Maybe.of(
                sections.find(
                    ([parsedTitle]) => parsedTitle.includes('About') && parsedTitle.includes(companyName)
                )
            ).map(R.prop('1')),
        ]);

        return {
            mandatorySections: Object.fromEntries(mandatorySections) as PageSections['mandatorySections'],
            optionalSections: Object.fromEntries(optionalSections) as PageSections['optionalSections'],
        };
    }

    async getJobDetailsFor(jobCard: IJobCard): Promise<IJobDetails> {
        try {
            await this.loadPageFor(jobCard);

            const mainContainer = await this.getMainContainer();
            const header = await this.getHeader(mainContainer);

            const headerInfo = await this.parseHeader(header);

            const sections = await this.getDetailsSections(mainContainer, headerInfo.companyName);
            const partialjobDetails = await mapSectionsToJobDetails(sections);

            return {
                jobId: jobCard.jobId,
                imageUrl: jobCard.imageUrl,
                ...partialjobDetails,
                ...headerInfo,
            } as IJobDetails;
        } catch (e) {
            console.log('Exception at ' + jobCard.detailUrl);
            console.log(e);
        }
    }
}

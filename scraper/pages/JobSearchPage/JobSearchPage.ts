import { Page } from 'puppeteer';

import { Maybe } from '@models/util/Maybe';

import { toJobCard } from './JobCard';

export const jobListItemSelector = '.js-search-results [data-jobid][data-result-id][data-preview-url]';
const URL = 'https://stackoverflow.com/jobs?q=react&tl=reactjs';

export class JobSearchPage {
    private page: Page;

    currentPageNumber: number;

    constructor(blankPage: Page) {
        this.page = blankPage;
    }

    async goToPage(pageNum: number) {
        if (this.currentPageNumber === pageNum) {
            return;
        }

        await this.page.goto(`${URL}&pg=${pageNum}`, {
            waitUntil: 'networkidle2',
        });

        this.currentPageNumber = pageNum;
    }

    async getAvailablePages() {
        const paginationBar = Maybe.of(await this.page.$('.s-pagination')).valueOrThrow(
            'Cannot find pagination bar'
        );

        const pageNumberItems = await paginationBar
            .$$('.s-pagination--item')
            .then((items) =>
                Promise.all(
                    items.map((item) =>
                        item.getProperty('innerText').then((value) => value.jsonValue() as Promise<string>)
                    )
                )
            );

        return pageNumberItems.map(Number).filter(Boolean);
    }

    async getJobCardsElements() {
        return Maybe.of(await this.page.$$(jobListItemSelector)).valueOrThrow(
            `No joblist found on page ${this.currentPageNumber}`
        );
    }

    async getJobCardsForPage(pageNum: number) {
        await this.goToPage(pageNum);

        const jobList = await this.getJobCardsElements();

        try {
            return await Promise.all(jobList.map(toJobCard));
        } catch (e) {
            console.log(`Error on page ${pageNum}: ${e}`);
        }
    }

    async getAllJobCards(limitToPageN = Infinity) {
        await this.goToPage(1);

        const pageNumbers = await this.getAvailablePages();

        const jobCards: JobCard[] = [];
        for (const pageNum of pageNumbers.slice(0, limitToPageN)) {
            const pageCards = await this.getJobCardsForPage(pageNum);
            jobCards.push(...pageCards);
        }

        return jobCards;
    }
}

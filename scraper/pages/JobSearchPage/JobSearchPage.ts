import { Page } from 'puppeteer';
import R, { range, head } from 'ramda';

import { Maybe } from '@models/util/Maybe';
import { timer } from '@utils/async';
import { IJobCard } from '@models/IJobCard';

import { toJobCard } from './JobCard';

export const jobListItemSelector = '.js-search-results [data-jobid][data-result-id][data-preview-url]';
const URL = 'https://stackoverflow.com/jobs?';
const searchPatams = 'q=react&tl=reactjs';

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

    async getAvailablePages(): Promise<number[]> {
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

        const pageNumbers = pageNumberItems.map(Number).filter(Boolean);
        const [firstPage, lastPage] = [R.head(pageNumbers), R.last(pageNumbers)];

        return range(firstPage, lastPage + 1);
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

        const jobCards: IJobCard[] = [];
        for (const pageNum of pageNumbers.slice(0, limitToPageN)) {
            const pageCards = await this.getJobCardsForPage(pageNum);
            jobCards.push(...pageCards);
            await timer(2000);
        }

        return jobCards;
    }
}

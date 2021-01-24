import 'module-alias/register';
import puppeteer from 'puppeteer';

import { JobSearchPage } from './scraper/pages/JobSearchPage/JobSearchPage';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const blankPage = await browser.newPage();

    const jobSearchPage = new JobSearchPage(blankPage);
    const jobCards = await jobSearchPage.getAllJobCards();

    // todo: store
    console.log(jobCards);

    await browser.close();
})();

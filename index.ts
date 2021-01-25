import 'module-alias/register';
import puppeteer from 'puppeteer';

import { JobSearchPage, JobDetailsPage } from './scraper/pages';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    // const jobSearchPage = new JobSearchPage(page);
    // const jobCards = await jobSearchPage.getAllJobCards();

    // // todo: store
    // console.log(jobCards);

    // const jobDetailsPage = new JobDetailsPage(page);

    // for (const jobCard of jobCards) {
    //     await page.goto(jobCard.detailUrl);
    //     const jobDetails = await jobDetailsPage.getJobInfo();
    //     console.log(jobDetails); 
    // }

    const jobSearchPage = new JobSearchPage(page);
    const jobCards = await jobSearchPage.getJobCardsForPage(1);

    const jobDetailsPage = new JobDetailsPage(page);
    
    console.log(await jobDetailsPage.getJobInfo());

    await browser.close();
})();

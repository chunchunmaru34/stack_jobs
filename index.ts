import 'module-alias/register';
import puppeteer, { Page } from 'puppeteer';
import { connect, IDatabase, IRecord } from '@chunchun-db/client';
import { JobSearchPage } from './scraper/pages';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    const client = await connect({ port: 1488 });
    const db = await client.getDatabase('stack_jobs');

    await fetchAllJobs(page, db);

    await browser.close();
})();

async function fetchAllJobs(page: Page, db: IDatabase) {
    const jobSearchPage = new JobSearchPage(page);
    const jobCards = await jobSearchPage.getAllJobCards();

    const collection = await db.getCollection<IJobCard & IRecord>('job_cards');

    await collection.add(jobCards);
}

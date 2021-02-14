import { IJobCardClosed } from './models/IJobCard';
import 'module-alias/register';
import puppeteer, { Page } from 'puppeteer';
import { connect, ICollection, IDatabase, IRecord } from '@chunchun-db/client';
import { JobSearchPage } from './scraper/pages';
import { IJobCard } from '@models/IJobCard';

const connectionOptions = {
    port: 1488,
    host: 'http://192.168.1.30',
};

const jobCardsDbName = 'stack_jobs';
const jobCardsCollectionName = 'job_cards_full';
const jobCardsHistoryCollectionName = 'job_cards_full_history';

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });

    const page = await browser.newPage();

    const client = await connect(connectionOptions);

    let db: IDatabase;
    try {
        db = await client.getDatabase(jobCardsDbName);
    } catch (error) {
        db = await client.createDatabase(jobCardsDbName);
    }

    await fetchAllJobs(page, db);

    await browser.close();
})();

async function fetchAllJobs(page: Page, db: IDatabase) {
    const jobSearchPage = new JobSearchPage(page);
    const jobCards = await jobSearchPage.getAllJobCards();

    let collection: ICollection<IJobCard & IRecord>;
    try {
        collection = await db.getCollection<IJobCard & IRecord>(jobCardsCollectionName);
    } catch (error) {
        collection = await db.createCollection<IJobCard & IRecord>(jobCardsCollectionName);
    }

    const dateClosed = new Date().toISOString();
    const closedItems: Array<IJobCardClosed & IRecord> = (await collection.getAll())
        .filter((item) => !jobCards.some((card) => card.jobId === item.jobId))
        .map((item) => ({ ...item, dateClosed }));

    let historyCollection: ICollection<IJobCardClosed & IRecord>;
    try {
        historyCollection = await db.getCollection<IJobCardClosed & IRecord>(jobCardsHistoryCollectionName);
    } catch (error) {
        historyCollection = await db.createCollection<IJobCardClosed & IRecord>(
            jobCardsHistoryCollectionName
        );
    }

    if (closedItems.length) {
        await historyCollection.add(closedItems);
    }

    if (jobCards.length) {
        await collection.removeAll();
        await collection.add(jobCards);
    }
}

import * as logger from '@utils/logger';
import { Page } from 'puppeteer';
import { IDatabase, IRecord } from '@chunchun-db/client';
import { omit } from 'ramda';

import { JOB_CARDS_COLLECTION_NAME, JOB_CARDS_HISTORY_COLLECTION_NAME } from '@constants/index';
import { IJobCard, IJobCardClosed } from '@models/IJobCard';
import { getCollection } from '@utils/db';
import { toIds, toJobIds } from '@utils/index';

import { JobSearchPage } from './pages';

const getCollections = (db: IDatabase) =>
    Promise.all([
        getCollection<IJobCard>(db, JOB_CARDS_COLLECTION_NAME),
        getCollection<IJobCardClosed>(db, JOB_CARDS_HISTORY_COLLECTION_NAME),
    ]);

const getClosedCards = (
    currentCards: Array<IJobCard & IRecord>,
    freshJobCardIds: Set<IJobCard['jobId']>
): Array<IJobCardClosed & IRecord> => {
    const dateClosed = new Date().toISOString();
    return currentCards
        .filter((card) => !freshJobCardIds.has(card.jobId))
        .map((item) => ({ ...item, dateClosed }));
};

async function fetchAllJobs(page: Page, db: IDatabase) {
    const [collection, historyCollection] = await getCollections(db);
    const currentJobCards = await collection.getAll();
    const currentJobCardIds = toJobIds(currentJobCards);

    const jobSearchPage = new JobSearchPage(page);
    const freshJobCards = await jobSearchPage.getAllJobCards();
    const freshJobCardIds = toJobIds(freshJobCards);

    await logger.log(`Found ${freshJobCards.length} job cards`);

    const closedItems = getClosedCards(currentJobCards, freshJobCardIds);
    const closedItemsIds = toIds(closedItems);

    const newItems = freshJobCards.filter((card) => !currentJobCardIds.has(card.jobId));

    await logger.log(`${closedItems.length} items closed. ${newItems.length} new items`);

    if (closedItems.length) {
        const closedItemsFormatted: IJobCardClosed[] = closedItems.map(omit(['id']));
        await historyCollection.add(closedItemsFormatted);
        await collection.remove([...closedItemsIds]);

        await logger.log('Moving closed items to history');
    }

    if (newItems.length) {
        await collection.add(newItems);

        await logger.log('adding new items to DB');
    }
}

export async function runJobCardsScraper(page: Page, db: IDatabase) {
    await logger.log('Scraping job cards');

    await fetchAllJobs(page, db);

    await logger.log('Job cards scrapped successfully');
}

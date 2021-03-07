import { Page } from 'puppeteer';
import { omit } from 'ramda';

import { Maybe } from '@models/util/Maybe';
import { error, log, critical } from '@utils/logger';
import { IDatabase, IRecord } from '@chunchun-db/client';
import { IJobDetails } from '@models/IJobDetails';
import { getCollection } from '@utils/db';
import { IJobCard } from '@models/IJobCard';
import {
    JOB_DETAILS_COLLECTION_NAME,
    JOB_CARDS_COLLECTION_NAME,
    JOB_DETAILS_HISTORY_COLLECTION_NAME,
} from '@constants/index';
import { promiseQueue } from '@utils/async';
import { toJobIds, toIds } from '@utils/index';

import { JobDetailsPage } from './pages';

const ONE_SESSION_ITEMS_LIMIT = 150;
const FETCH_ITEM_COOLDOWN_MS = 3000;

const fetchItems = (tasks: Array<() => Promise<Maybe<IJobDetails>>>) =>
    promiseQueue(FETCH_ITEM_COOLDOWN_MS, tasks);

type CloseJobDetails = IJobDetails & { dateClosed: string };

const getCollections = (db: IDatabase) =>
    Promise.all([
        getCollection<IJobCard>(db, JOB_CARDS_COLLECTION_NAME),
        getCollection<IJobDetails>(db, JOB_DETAILS_COLLECTION_NAME),
        getCollection<CloseJobDetails>(db, JOB_DETAILS_HISTORY_COLLECTION_NAME),
    ]);

const getClosedDetails = (prevDetails: Array<IJobDetails & IRecord>, cardIds: Set<IJobCard['jobId']>) => {
    const dateClosed = new Date().toISOString();
    const closedDetails: Array<CloseJobDetails & IRecord> = prevDetails
        .filter((details) => !cardIds.has(details.jobId))
        .map((item) => ({ ...item, dateClosed }));

    return closedDetails;
};

const cardToTask = (jobDetailsPage: JobDetailsPage) => (card: IJobCard) => async () => {
    try {
        const result = await jobDetailsPage.getJobDetailsFor(card);
        return Maybe.Some(result);
    } catch (e) {
        await critical(
            `Encountered error while fetching job with id ${card.jobId} (${card.jobTitle}). Stack trace: \n ${e}`
        );
        return Maybe.None<IJobDetails>();
    }
};

async function fetchJobDetails(page: Page, db: IDatabase) {
    const [cardsCollection, detailsCollection, detailsHistoryCollection] = await getCollections(db);

    const [cards, prevDetails] = await Promise.all([cardsCollection.getAll(), detailsCollection.getAll()]);
    const [cardIds, prevDetailsIds] = [cards, prevDetails].map(toJobIds);

    const closedDetails = getClosedDetails(prevDetails, cardIds);
    const closedDetailsIds = toIds(closedDetails);

    const cardsWithoutDetails = cards.filter((card) => !prevDetailsIds.has(card.jobId));

    if (!cardsWithoutDetails.length) {
        log('All cards has details, no action required');
        return;
    }

    await log(
        `Found ${cardsWithoutDetails.length} cards without details. Fetching first ${ONE_SESSION_ITEMS_LIMIT} items...`
    );

    const jobDetailsPage = new JobDetailsPage(page);
    const getDetails = cardToTask(jobDetailsPage);
    const tasks = cardsWithoutDetails.slice(0, ONE_SESSION_ITEMS_LIMIT).map(getDetails);

    const result = await fetchItems(tasks);
    const newDetails = result.filter((x) => x.isSome).map((x) => x.getValue());

    await log(
        `${newDetails.length} details were fetched. ${result.length - newDetails.length} returned an error`
    );

    if (closedDetails.length) {
        const closedDetailsFormatted: CloseJobDetails[] = closedDetails.map(omit(['id']));
        await detailsHistoryCollection.add(closedDetailsFormatted);
        await detailsCollection.remove([...closedDetailsIds]);
        await log(`${closedDetails.length} details were moved to history`);
    }

    if (newDetails.length) {
        await detailsCollection.add(newDetails);

        await log(`Db updated successfully`);
    }
}

export async function runJobDetailsScraper(page: Page, db: IDatabase) {
    await log('Scrapping job details');

    await fetchJobDetails(page, db);

    await log('Scrapped job details successfully');
}

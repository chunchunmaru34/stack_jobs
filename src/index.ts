import 'module-alias/register';
import dotenv from 'dotenv';
import puppeteer, { Page } from 'puppeteer';

import * as logger from '@utils/logger';
import { connect, IDatabase } from '@chunchun-db/client';

dotenv.config();

import { getDb } from '@utils/db';
import { connectionOptions, RUN_MODES, DB_NAME } from '@constants/index';
import { getMode } from '@utils/index';

import puppeteerConfig from './puppeteer-config.env';
import { runJobCardsScraper, runJobDetailsScraper } from './scraper';

export const scrapersByMode: { [key in RUN_MODES]: (page: Page, db: IDatabase) => Promise<void> } = {
    [RUN_MODES.JOB_CARDS]: runJobCardsScraper,
    [RUN_MODES.JOB_DETAILS]: runJobDetailsScraper,
};

(async () => {
    const browser = await puppeteer.launch(puppeteerConfig);
    try {
        const mode = getMode();

        const page = await browser.newPage();

        const client = await connect(connectionOptions);
        let db = await getDb(client, DB_NAME);

        await scrapersByMode[mode](page, db);
    } catch (e) {
        await logger.critical(e);
    } finally {
        await browser.close();
    }
})();

import puppeteer, { ElementHandle } from 'puppeteer';

import { jobListItemSelector } from './constants/selectors';
import { Maybe } from './models/Maybe';

const URL = 'https://stackoverflow.com/jobs?q=react&tl=reactjs';

async function getJobTitleInfo(containerElement: ElementHandle) {
    const headerBlockSelector = 'h2 a';

    return Maybe.of(await containerElement.$(headerBlockSelector))
        .map((element) => {
            const title = element
                .getProperty('title')
                .then((handler) => handler.jsonValue()) as Promise<string>;
            const detailsUrl = element
                .getProperty('href')
                .then((handler) => handler.jsonValue()) as Promise<string>;

            return Promise.all([title, detailsUrl]);
        })
        .valueOrThrow('Could not find job title block');
}

async function getCompanyInfo(containerElement: ElementHandle) {
    return Promise.all(
        Maybe.of(await containerElement.$$('h3 > span'))
            .valueOrThrow('Could not find company info block')
            .map((span) =>
                span
                    .getProperty('innerText')
                    .then((handler) => handler.jsonValue())
            )
    );
}

async function getCompanyImageUrl(containerElement: ElementHandle) {
    const imageBlock = Maybe.of(await containerElement.$('img'));

    return imageBlock
        .map((image) =>
            image.getProperty('src').then((handler) => handler.jsonValue())
        )
        .valueOrDefault(Promise.resolve(''));
}

async function toJobCard(containerElement: ElementHandle) {
    const headersPromises = getJobTitleInfo(containerElement);
    const companyInfoBlockPromises = getCompanyInfo(containerElement);
    const imageUrlPromise = getCompanyImageUrl(containerElement);

    const handlers = await Promise.all([
        headersPromises,
        companyInfoBlockPromises,
        imageUrlPromise,
    ]);
    const [
        [jobTitle, detailUrl],
        [companyName, companyLocation],
        imageUrl,
    ] = await Promise.all(handlers);

    const info = {
        jobTitle,
        detailUrl,
        companyName,
        companyLocation,
        imageUrl,
    };

    console.log(info);
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
    });
    const page = await browser.newPage();
    await page.goto(URL, {
        waitUntil: 'networkidle2',
    });

    const jobList = Maybe.of(await page.$$(jobListItemSelector));
    try {
        await Promise.all(
            jobList
                .map((elHandlers) => elHandlers.map(toJobCard))
                .valueOrThrow('No joblist found')
        );
    } catch (e) {
        console.log(e);
    }

    await browser.close();
})();

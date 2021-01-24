import { ElementHandle } from 'puppeteer';

import { Maybe } from '@models/util/Maybe';

export async function getJobTitleInfo(containerElement: ElementHandle) {
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

export async function getCompanyInfo(containerElement: ElementHandle) {
    return Promise.all(
        Maybe.of(await containerElement.$$('h3 > span'))
            .valueOrThrow('Could not find company info block')
            .map((span) =>
                span.getProperty('innerText').then((handler) => handler.jsonValue() as Promise<string>)
            )
    );
}

export async function getCompanyImageUrl(containerElement: ElementHandle) {
    const imageBlock = Maybe.of(await containerElement.$('img'));

    return imageBlock
        .map((image) => image.getProperty('src').then((handler) => handler.jsonValue() as Promise<string>))
        .valueOrDefault(Promise.resolve(''));
}

export async function toJobCard(containerElement: ElementHandle) {
    const headersPromises = getJobTitleInfo(containerElement);
    const companyInfoBlockPromises = getCompanyInfo(containerElement);
    const imageUrlPromise = getCompanyImageUrl(containerElement);

    const handlers = await Promise.all([headersPromises, companyInfoBlockPromises, imageUrlPromise]);
    const [[jobTitle, detailUrl], [companyName, companyLocation], imageUrl] = await Promise.all(handlers);

    const info = {
        jobTitle,
        detailUrl,
        companyName,
        companyLocation,
        imageUrl,
    };

    return info;
}

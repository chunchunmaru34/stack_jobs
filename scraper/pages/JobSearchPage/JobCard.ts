import { ElementHandle } from 'puppeteer';

import { Maybe } from '@models/util/Maybe';
import { toInnerText } from '@utils/puppeteer';
import { salaryRange } from '@constants/regex';
import { IJobCard } from '@models/IJobCard';

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

export async function parseTechnologies(containerElement: ElementHandle) {
    const tags = Maybe.of(await containerElement.$$('a.post-tag')).valueOrThrow(
        'Cannot find technologies tags'
    );

    return Promise.all(tags.map(toInnerText));
}

export async function parsePerksList(containerElement: ElementHandle) {
    const list = Maybe.of(await containerElement.$('ul.horizontal-list')).valueOrThrow(
        'Cannot find perk list'
    );

    const perks = await list.$$('li').then((els) => Promise.all(els.map(toInnerText)));

    const perksInfo = {
        salary: perks.find((perk) => perk.match(salaryRange)),
        isEquityIncluded: !!perks.find((perk) => perk.toLowerCase() === 'equity'),
        remote: perks.find((perk) => perk.toLowerCase().includes('remote')),
        isVisaSponsored: !!perks.find((perk) => perk.toLowerCase() === 'visa sponsor'),
        isPaidRelocation: !!perks.find((perk) => perk.toLowerCase() === 'paid relocation'),
    };

    return perksInfo;
}

export async function toJobCard(containerElement: ElementHandle): Promise<IJobCard> {
    const headersPromises = getJobTitleInfo(containerElement);
    const companyInfoBlockPromises = getCompanyInfo(containerElement);
    const imageUrlPromise = getCompanyImageUrl(containerElement);
    const technologiesPromise = parseTechnologies(containerElement);
    const perksPromise = parsePerksList(containerElement);

    const handlers = await Promise.all([
        headersPromises,
        companyInfoBlockPromises,
        imageUrlPromise,
        technologiesPromise,
        perksPromise,
    ]);
    const [[jobTitle, detailUrl], [companyName, companyLocation], imageUrl, technologies, perks] = handlers;

    const jobId = await containerElement
        .evaluate((e) => e.getAttribute('data-jobid'), containerElement)
        .then(Number);

    const info = {
        jobId,
        jobTitle,
        detailUrl,
        companyName,
        companyLocation,
        imageUrl,
        technologies,
        ...perks,
    };

    return info;
}

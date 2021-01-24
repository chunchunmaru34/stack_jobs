import { ElementHandle } from 'puppeteer';

import { getJobTitleInfo, getCompanyInfo, getCompanyImageUrl, toJobCard } from './JobCard';
import { JobSearchPage } from './JobSearchPage';

describe('Job Card', () => {
    let containerElement: ElementHandle;

    beforeAll(async () => {
        const jobSearchPage = new JobSearchPage(page);

        await jobSearchPage.goToPage(1);
        containerElement = (await jobSearchPage.getJobCardsElements())[0];
    });

    test('it should get job title info', async () => {
        const [jobTitle, detailsUrl] = await getJobTitleInfo(containerElement);

        expect(typeof jobTitle).toBe('string');
        expect(jobTitle.length).toBeGreaterThan(0);

        expect(typeof detailsUrl).toBe('string');
        expect(detailsUrl.length).toBeGreaterThan(0);
    });

    test('it should get company info', async () => {
        const companyString = await getCompanyInfo(containerElement);

        expect(companyString.length).toBe(2);

        const [companyName, companyLocation] = companyString;

        expect(typeof companyName).toBe('string');
        expect(companyName.length).toBeGreaterThan(0);

        expect(typeof companyLocation).toBe('string');
        expect(companyLocation.length).toBeGreaterThan(0);
    });

    test('it should try get company logo', async () => {
        await getCompanyImageUrl(containerElement);
    });

    test('it should return a valid info object from element', async () => {
        const jobCardInfo = await toJobCard(containerElement);

        expect(jobCardInfo).toHaveProperty('jobTitle');
        expect(jobCardInfo).toHaveProperty('detailUrl');
        expect(jobCardInfo).toHaveProperty('companyName');
        expect(jobCardInfo).toHaveProperty('companyLocation');
    });
});

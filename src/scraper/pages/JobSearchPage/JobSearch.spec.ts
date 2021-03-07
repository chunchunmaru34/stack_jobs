import { JobSearchPage } from './JobSearchPage';

describe.skip('Job Search Page', () => {
    let jobsPage: JobSearchPage;

    beforeAll(async () => {
        jobsPage = new JobSearchPage(page);
    });

    test('it should load page', async () => {
        await jobsPage.goToPage(1);
    });

    test('it should get available pages', async () => {
        const pages = await jobsPage.getAvailablePages();

        expect(pages).toBeInstanceOf(Array);
        expect(pages.length).toBeGreaterThan(0);
    });

    test('it should find some jobcard elements', async () => {
        const jobCards = await jobsPage.getJobCardsElements();

        expect(jobCards.length).toBeGreaterThan(0);
    });

    test('it should be able to travel between pages', async () => {
        const pages = (await jobsPage.getAvailablePages()).slice(0, 5).filter(Boolean);

        for (const page of pages) {
            await jobsPage.goToPage(page);
        }
    }, 20000);

    test('it should get jobcard info for all pages', async () => {
        const jobCards = await jobsPage.getAllJobCards(5);

        expect(jobCards.length).toBeGreaterThan(0);
    }, 30000);
});

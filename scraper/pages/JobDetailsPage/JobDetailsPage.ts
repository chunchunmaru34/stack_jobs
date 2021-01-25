import { ElementHandle, Page } from "puppeteer";

import { Maybe } from "@models/util/Maybe";
import { getPropertyValue } from "utils/puppeteer";

const toInnerText = async (element: ElementHandle) => getPropertyValue("innerText")(element);

export class JobDetailsPage {
    page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async parseAboutSection(section: ElementHandle) {
        const lines = await section.$$(".mb8");
    }

    async getJobInfo() {
        const mainContainer = Maybe.of(await this.page.$("#mainbar")).valueOrThrow("No main container found");
        const header = Maybe.of(await mainContainer.$("header")).valueOrThrow("No job header found");

        const companyLink = Maybe.of(await header.$("a .employer")).valueOrThrow("No company link found");

        const companyUrl = await getPropertyValue("href")(companyLink);

        const sectionElements = await mainContainer.$$("section");

        const getSectionTitle = (el: ElementHandle) => el.$("h2").then(toInnerText);

        const sectionTitles = await Promise.all(sectionElements.map(getSectionTitle));
        const sections = sectionElements.map((el, index) => ({
            title: sectionTitles[index],
            el,
        }));

        ["About this job", "Techonologies", "Job description"].map((sectionTitle) =>
            Maybe.of(sections.find((s) => s.title === sectionTitle)).valueOrThrow(
                `Could not find section ${sectionTitle}`
            )
        );

        return {
            companyUrl,
        };
    }
}

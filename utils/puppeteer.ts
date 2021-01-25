import { ElementHandle } from "puppeteer";

export const getPropertyValue = (prop: string) => async (element: ElementHandle) =>
    element.getProperty(prop).then((prop) => prop.jsonValue() as Promise<string>);

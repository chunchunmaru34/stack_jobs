import { ElementHandle } from 'puppeteer';

export const getPropertyValue = <T = string>(prop: string) => async (element: ElementHandle) =>
    element.getProperty(prop).then((prop) => prop.jsonValue() as Promise<T>);

export const toInnerText = (element: ElementHandle) => getPropertyValue('innerText')(element);

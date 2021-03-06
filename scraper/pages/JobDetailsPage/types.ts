import { ElementHandle } from 'puppeteer';
import { ValuesOf } from '@models/util';
import { Maybe } from '@models/util/Maybe';

import { MandatorySections, OptionalSections } from './constants';

export type PageSections = {
    mandatorySections: {
        [key in ValuesOf<typeof MandatorySections>]: ElementHandle<Element>;
    };
    optionalSections: {
        [key in ValuesOf<typeof OptionalSections>]: Maybe<ElementHandle<Element>>;
    };
};

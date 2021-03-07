import { IRecord } from '@chunchun-db/client';
import { RUN_MODES, DEFAULT_MODE } from '@constants/index';
import { IJobCard } from '@models/IJobCard';
import { IJobDetails } from '@models/IJobDetails';

export function getMode() {
    const args = process.argv.slice(2);

    const modeArg = args.find((arg) => arg.includes('--mode='));
    if (modeArg) {
        const mode = modeArg.split('=')[1];

        if (Object.values(RUN_MODES).some((constMode) => constMode === mode)) {
            return mode;
        } else {
            console.log(`Incorrect mode "${mode}". Default mode "${DEFAULT_MODE} will be used"`);
        }
    }

    return DEFAULT_MODE;
}

export const toJobIds = <T extends IJobDetails | IJobCard>(items: T[]) => new Set(items.map((x) => x.jobId));
export const toIds = <T extends IRecord>(items: T[]) => new Set(items.map((x) => x.id));

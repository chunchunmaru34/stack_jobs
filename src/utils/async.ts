import { curry } from 'ramda';

import { splitToChunks } from './arrays';

export const timer = (timeMs: number) => new Promise((resolve) => setTimeout(resolve, timeMs));

export const promisePool = curry(
    async <T>(poolSize: number, cooldownMs: number, tasks: Array<() => Promise<T>>): Promise<T[]> => {
        const chunks = splitToChunks(tasks, poolSize);

        let results: T[] = [];

        for (let chunk of chunks) {
            const result = await Promise.all(chunk.map((fn) => fn()));
            results.push(...result);

            if (cooldownMs > 0 && chunk !== chunks[chunks.length - 1]) {
                await timer(cooldownMs);
            }
        }

        return results;
    }
);

export const promiseQueue: <T>(
    cooldownMs: number,
    tasks: Array<() => Promise<T>>
) => Promise<T[]> = promisePool(1);

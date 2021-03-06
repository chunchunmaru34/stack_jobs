import { splitToChunks } from './arrays';

export const timer = (timeMs: number) => new Promise((resolve) => setTimeout(resolve, timeMs));

export async function promisePool<T>(tasks: Array<() => Promise<T>>, poolSize: number, cooldownMs?: number) {
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

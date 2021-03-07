export function splitToChunks<T>(array: Array<T>, chunkSize: number): T[][] {
    const chunks = [];

    for (let i = 0; i < array.length; i += chunkSize) {
        chunks.push(array.slice(i, i + chunkSize));
    }

    return chunks;
}

export const toDictionaryBy = <T, K>(keyAccessor: (item: T) => K) => (array: T[]) =>
    array.reduce((map, item) => map.set(keyAccessor(item), item), new Map<K, T>());

export const toDictionaryById: <T extends { id: string | number }>(
    array: T[]
) => Map<T['id'], T> = toDictionaryBy((item) => item.id);

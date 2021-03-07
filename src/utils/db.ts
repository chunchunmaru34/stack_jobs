import { ICollection, IDatabase, IDbClient, IRecord } from '@chunchun-db/client';

export async function getCollection<T>(db: IDatabase, name: string) {
    let collection: ICollection<T & IRecord>;
    try {
        collection = await db.getCollection<T & IRecord>(name);
    } catch (error) {
        collection = await db.createCollection<T & IRecord>(name);
    }

    return collection;
}

export async function getDb(client: IDbClient, name: string) {
    let db: IDatabase;
    try {
        db = await client.getDatabase(name);
    } catch (error) {
        db = await client.createDatabase(name);
    }

    return db;
}

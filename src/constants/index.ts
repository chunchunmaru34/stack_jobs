export enum RUN_MODES {
    JOB_CARDS = 'cards',
    JOB_DETAILS = 'details',
}

export const DEFAULT_MODE = RUN_MODES.JOB_CARDS;

export const DB_NAME = process.env.DB_NAME ?? 'stack_jobs';

export const JOB_CARDS_COLLECTION_NAME = 'job_cards_full';
export const JOB_CARDS_HISTORY_COLLECTION_NAME = 'job_cards_full_history';

export const JOB_DETAILS_COLLECTION_NAME = process.env.DB_JOB_DETAILS_COLLECTION_NAME ?? 'job_details';
export const JOB_DETAILS_HISTORY_COLLECTION_NAME =
    process.env.DB_JOB_DETAILS_HISTORY_COLLECTION_NAME ?? 'job_details_history';

export const connectionOptions = {
    port: +process.env.DB_PORT ?? 1488,
    host: process.env.DB_HOSTNAME ?? '0.0.0.0',
};

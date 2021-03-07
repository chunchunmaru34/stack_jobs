import axios from 'axios';

const URL = 'https://api.telegram.org/bot480428639:AAHCdvoVomY1Q3SXpLB_jqKsa89oWXaqPls/sendMessage';
const CHAT_ID = 397700988;
const TG_MAX_CHARS = 4096;

const getFormattedTime = () => {
    const date = new Date();

    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

export const log = async (message: string) => console.log(`${getFormattedTime()}: ${message}`);

export const error = async (message: string) => console.error(`${getFormattedTime()}: ${message}`);

export const critical = async (message: string) => {
    if (!message) {
        return;
    }

    try {
        await axios.post(URL, {
            chat_id: CHAT_ID,
            text: formatTgMessage(`Stack jobs scraper encountered error: ${message}`),
            parse_mode: 'HTML',
        });
    } catch (e) {
        await error(e.response);
    }
};

const formatTgMessage = (message: string) => {
    return message.slice(0, TG_MAX_CHARS - 3) + '...';
};

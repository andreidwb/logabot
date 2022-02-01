import { CoinMarketQuotes } from "./CoinMarketQuotes";

export type CoinMarketCoin = {
    name: string;
    symbol: string;
    quote: CoinMarketQuotes;
    timestamp: Date;
};
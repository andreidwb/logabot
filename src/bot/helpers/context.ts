import { Context } from "telegraf";
import { Update, Message } from "telegraf/typings/core/types/typegram";
import { CoinMarketCoin } from "../models/CoinMarketCoin";
import { Joke } from "../models/Joke";
import rp from 'request-promise';

interface MyContext extends Context {
    myProp?: string
    myOtherProp?: number
}

function getUser(ctx: Context<{ message: Update.New & Update.NonChannel & Message.TextMessage; update_id: number; }> & Omit<MyContext, keyof Context<Update>>) {
    let user = ctx.from.username;
    if (!ctx.from.username) {
        user = ctx.from.first_name
    }
    return user;
}

function formatPrice(price: number, decimals: number = 2) {
    return `${price.toLocaleString('en-us', { maximumFractionDigits: decimals })}`
}

function getJoke(): Promise<Joke> {
    return fetch('https://api.yomomma.info/')
        .then(res => res.json())
        .then(res => {
            console.log(res);
            let joke = res as Joke;
            console.log(joke);
            return res as Joke;
        });
};

function replyShortCrypto(ctx: any, stock: string) {
    let user = getUser(ctx);

    if (stock == undefined || stock.trim() == "") {
        ctx.reply(
            `Please give me a coin I can search\. Example:
        /c BTC`
        );

        return;
    }

    getCrypto(stock).then(result => {
        console.log('crypto', result);
        if (result == undefined || result.name == undefined) {
            ctx.reply(`Couldn't find coin ${stock}\.`);
            return;
        };

        let price = result.quote.USD.price;
        let formattedPrice = result.symbol !== 'ELONGATE' ? formatPrice(price, 4) : formatPrice(price, 8);

        ctx.replyWithMarkdown(`@${user} the current value for *${result.name} [${result.symbol}]* is *$${formattedPrice}* \\[1h ${formatPrice(result.quote.USD.percent_change_1h)}%\] \\[24h ${formatPrice(result.quote.USD.percent_change_24h)}%\]`);
    }).catch(error => {
        ctx.reply(error.message);
    });
}

function getCrypto(ticker: string): Promise<CoinMarketCoin> {
    ticker = ticker.toUpperCase().trim();
    let qs = {
        'symbol': ticker,
        'convert': 'USD'
    };
    let wmtQs = {
        id: 13769
    }

    return rp({
        method: 'GET',
        uri: 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest',
        qs: ticker == 'WMT' ? wmtQs : qs,
        headers: {
            'X-CMC_PRO_API_KEY': 'fba2e18e-d123-4a97-8450-8686fedbb1e8'
        },
        json: true,
        gzip: true
    })
        .then(res => {
            var dataKey = ticker == 'WMT' ? 13769 : ticker;

            if (res.data[dataKey] == undefined) {
                throw new Error("There's no ticker with the name " + ticker);
            }

            console.log('response from api', res);

            let response = res.data[dataKey];
            return response as CoinMarketCoin;
        }).catch((err) => {
            console.log('API call error: ', err.message);

            throw new Error("API: " + err.message);
        });
};

export { MyContext, getUser, formatPrice, getCrypto, getJoke, replyShortCrypto };
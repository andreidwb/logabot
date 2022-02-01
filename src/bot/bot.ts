import { Telegraf } from "telegraf";
import yahooFinance from "yahoo-finance2";
import { botConstants } from "./models/constants";
import rp from 'request-promise';
import fetch from 'node-fetch';
import { appConfig } from "../config";
import { MyContext, getJoke, getUser, formatPrice, replyShortCrypto, getCrypto } from "./helpers/context";

export const botApiKey: string = appConfig.botKey || '';

export var bot = new Telegraf<MyContext>(botApiKey);
bot.use((ctx, next) => {
    ctx.myProp = ctx.chat?.id.toString();
    return next();
});
bot.start((ctx) => ctx.reply(botConstants.startMessage));
bot.command('summon', (ctx) => ctx.reply(botConstants.startMessage));
bot.command(['donations', 'donate'], (ctx) => ctx.reply(botConstants.donateMessage));
bot.command('joke', (ctx) => getJoke().then(joke => { ctx.reply("One for you: " + joke.joke); }));
bot.command('s', (ctx) => {
    console.log(ctx);
    let stock = ctx.message.text.substring(2).trim().toUpperCase();
    yahooFinance.quoteSummary(stock, {
        // 1. Try adding, removing or changing modules
        // You'll get suggestions after typing first quote mark (")
        modules: ["price"]
    }).then(result => {
        if (result == undefined || result.price == undefined) {
            ctx.reply(`Couldn't find ${stock}. Check on Yahoo Finance if it's there.`);
            return;
        };

        let user = getUser(ctx);
        let price = result.price?.regularMarketPrice;
        let change = Number(Number(result.price?.regularMarketChangePercent) * Number(100)).toFixed(2) + "%";
        let cap = result.price?.marketCap ? result.price?.marketCap : 0;

        ctx.replyWithMarkdown(`@${user} the current value for *${result.price.longName} [${result.price.exchangeName}:${stock}]* is *$${price}*. Daily change ${change}. CAP $${formatPrice(cap, 0)}`);
    }).catch(error => {
        ctx.reply(error);
    });
}
);
bot.command('what', (ctx) => {
    console.log(ctx);
    let word = ctx.message.text.substring(6).trim().toUpperCase();
    console.log('WORD: ' + word);
    return rp({
        method: 'GET',
        uri: 'https://api.duckduckgo.com/?q=' + word + '&format=json&pretty=1',
        json: true,
        gzip: true
    })
        .then(res => {
            console.log(res);
            if (res.AbstractURL == '') {
                ctx.reply('No.');
                return;
            }
            let message = `Here is your result on ${res.AbstractSource}: ${res.AbstractURL}`;
            ctx.reply(message);
        })
        .catch((err) => {
            console.log('API call error: ', err.message);
        });
});
bot.command('stock', (ctx) => {
    console.log(ctx);
    let stock = ctx.message.text.substring(7).trim().toUpperCase();
    yahooFinance.quoteSummary(stock, {
        // 1. Try adding, removing or changing modules
        // You'll get suggestions after typing first quote mark (")
        modules: ["price"]
    }).then(result => {
        if (result == undefined || result.price == undefined) {
            ctx.reply(`Couldn't find ${stock}. Check on Yahoo Finance if it's there.`);
            return;
        };

        console.log(result);
        let user = getUser(ctx);
        let price = result.price?.regularMarketPrice;
        let change = Number(Number(result.price?.regularMarketChangePercent) * Number(100)).toFixed(2) + "%";
        let cap = result.price?.marketCap ? result.price?.marketCap : 0;

        ctx.replyWithMarkdown(`@${user} the current value for *${result.price.longName} [${result.price.exchangeName}:${stock}]* is *$${price}*. Daily change ${change}. CAP $${formatPrice(cap, 0)}`);
    }).catch(error => {
        ctx.reply(error);
    });
}
);
bot.command(['c'], (ctx) => {
    let stock = ctx.message.text.substring(2).trim().toUpperCase();
    replyShortCrypto(ctx, stock);
});
bot.command(['btc', 'eth', 'ada', 'wmt', 'coti', 'agix', 'sdao', 'ntx', 'dot', 'link', 'erg', 'boson', 'one', 'cro'], (ctx) => {
    let stock = ctx.message.text.substring(1).toUpperCase();
    replyShortCrypto(ctx, stock);
});
bot.command(['crypto'], (ctx) => {
    let user = getUser(ctx);
    let stock = ctx.message.text.substring(8).trim().toUpperCase();

    if (stock == undefined || stock.trim() == "") {
        ctx.reply(
            `Please give me a coin I can search, for example:
        /crypto BTC`
        );

        return;
    }

    getCrypto(stock).then(result => {
        if (result == undefined || result.name == undefined) {
            ctx.reply(`Couldn't find coin ${stock}\.`);
            return;
        };

        let price = result.quote.USD.price;
        let formattedPrice = result.symbol !== 'ELONGATE' ? formatPrice(price, 4) : formatPrice(price, 8);

        if (result.symbol == 'ELONGATE') {
            user = `${user} (real elongator)`;
        }

        let response = `@${user} the current value for *${result.name} [${result.symbol}]* is *$${formattedPrice}*
           1h   ${formatPrice(result.quote.USD.percent_change_1h)}%
          24h   ${formatPrice(result.quote.USD.percent_change_24h)}%
           7d   ${formatPrice(result.quote.USD.percent_change_7d)}%
          30d   ${formatPrice(result.quote.USD.percent_change_30d)}%
          60d   ${formatPrice(result.quote.USD.percent_change_60d)}%
          90d   ${formatPrice(result.quote.USD.percent_change_90d)}%
          CAP  $${formatPrice(result.quote.USD.market_cap, 0)}`;

        console.log(response);

        ctx.replyWithMarkdown(response);
    }).catch(error => {
        ctx.reply(error);
    });
}
);
bot.command(['roll'], (ctx) => {
    let random = Math.floor(Math.random() * 100);
    ctx.reply(`Between 1-100: ${random}`);
}
);
bot.command(['ily', 'loveyou', 'hateyou', 'love', 'hate', 'fuckyou'], (ctx) => {
    var answer = Array("♥️", "I will always be here", "No.", "Yes.", "Thank you!", "Please honor me more");
    let random = answer[Math.floor(Math.random() * answer.length)];
    ctx.reply(random);
}
);
bot.command(['should', 'does', 'do', 'may', 'can', 'will', 'did', 'has', 'have', 'is', 'are'], (ctx) => {
    var answer = Array("Yes.", "No.", "Maybe.", "Who knows?", "HE BOUGHT", "Load ze dump.", "This was once revealed to me in a dream: yes", "This was once revealed to me in a dream: no");
    let random = answer[Math.floor(Math.random() * answer.length)];
    ctx.reply(random);
}
);
bot.command(['when', 'wen'], (ctx) => {
    var answer = Array("Now!", "Later", "Patience", "Maybe never", "HE BOUGHT", "🚀", "Past is in the past.", "You can forget it", "This was once revealed to me in a dream.");
    let random = answer[Math.floor(Math.random() * answer.length)];
    ctx.reply(random);
}
);
bot.command('renittos', (ctx) => ctx.reply(`$XRP is the way 🚀🚀🚀🚀🚀 🌝 !!!`));

import app from './server';
import config from '../config.json';
import { Context, Telegraf, Markup } from 'telegraf';
import fetch, { Request } from 'node-fetch';
import yahooFinance from 'yahoo-finance2';
import rp from 'request-promise';
import { Update, Message } from 'typegram';

// Start the application by listening to specific port
const port = Number(process.env.PORT || config.PORT || 8080);
const botProd = '1611584701:AAHJ2up8O0ugiepLQo4L2-w0seaXp_c6WLk';
const botDev = '1735159989:AAEq4Yg1tELrcmd6V5fz-HvpiAzoHDiDdlM';

app.get('/', (req, res) => {
  res.send('Hello World');
  console.info('Hello World');
});

app.listen(port, () => {
  console.info('Express application started on port: ' + port);
});


// Define your own context type
interface MyContext extends Context {
  myProp?: string
  myOtherProp?: number
}

// Create your bot and tell it about your context type
const bot = new Telegraf<MyContext>(botProd);

// const keyboard = Markup.keyboard([
//   Markup.button.pollRequest('Create me a poll', 'regular'),
//   Markup.button.callback('joke', 'joke')
// ])

// Register middleware and launch your bot as usual
bot.use((ctx, next) => {
  // Yay, `myProp` is now available here as `string | undefined`!
  ctx.myProp = ctx.chat?.id.toString();
  return next();
});

let startMessage = `Hi there! These are the (official) supported commands: 
/s [ticker]
/stock [ticker] 
/c [ticker]
/crypto [ticker]
/donate
And, of course: /lol /targaryen /redday /vaffanculo /porcodio /admin /gme
If you love or hate me: /ily, /loveyou, /hateyou, /love, /hate, /fuckyou
If you want my wisdom, you can ask me: /should, /does, /do, /may, /can, /will, /did, /has, /have, /is, /are
If you want to know WHEN: /when /wen
If you want a lucky shot: /roll
You want a momma joke: /joke
If you want to search for something: /what [what]

Just try some of your names, you can get something personalized`;

bot.start((ctx) => ctx.reply(startMessage));
bot.command('summon', (ctx) => ctx.reply(startMessage));

bot.command('donations', (ctx) => ctx.reply(
  `It takes dedication to develop myself, please support me with ADA (Cardano) here: 
   addr1q9rp5wl8face9u8hwkp82005pca0pcg46d03ma69s2xgmu3t3effhzvfqqz2karfphuc5arstskfxr6ezayxxdkwj2fqm62dpy

So much appreciated!`));

bot.command('donate', (ctx) => ctx.reply(
  `It takes dedication to develop myself, please support me with ADA (Cardano) here: 
   addr1q9rp5wl8face9u8hwkp82005pca0pcg46d03ma69s2xgmu3t3effhzvfqqz2karfphuc5arstskfxr6ezayxxdkwj2fqm62dpy

So much appreciated!`));

bot.command('joke', (ctx) =>
  getJoke().then(joke => {
    ctx.reply("One for you: " + joke.joke);
  })
);

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

    let response =
      `@${user} the current value for *${result.name} [${result.symbol}]* is *$${formattedPrice}*
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


bot.command('fuckyou', (ctx) => {
  let user = getUser(ctx);
  getJoke().then(joke => {
    ctx.reply(`@${user}, I know this is you chatting. This one is on you, my friend: ` + joke.joke);
  });
}
);

bot.command('gme', (ctx) => {
  ctx.reply(`GME needs our momma, Mr. @Narwhal40. Please provide us!`);
}
);

bot.command('targaryen', (ctx) => {
  ctx.reply(`Daenerys Stormborn of the House Targaryen, First of Her Name, the Unburnt, Queen of the Andals and the First Men, Khaleesi of the Great Grass Sea, Breaker of Chains, and Mother of Dragons.`);
}
);

bot.command('gabe', (ctx) => {
  let random = Math.floor(Math.random() * 100);
  ctx.reply(`@logabe PLTR to: ${random}`);
}
);

bot.command('gabri', (ctx) => {
  ctx.reply(`@Narwhal40 We are the GME crew!`);
}
);

bot.command('joe', (ctx) => {
  ctx.reply(`porcodio, #elongate to the 🌝!`);
}
);

bot.command('karol', (ctx) => {
  ctx.reply(`@Zebr0o he bought`);
}
);

bot.command('elongate', (ctx) => {
  ctx.reply(`ElonGators, unite. #elongate to the 🌝`);
}
);

bot.command('redday', (ctx) => {
  ctx.reply(`Hey, you on a red day. Happens to you, but we know that it does happen no matter the stock. Hand in there, and there'll be so much green for you, you'll just want to smoke it!`);
}
);

bot.command('no', (ctx) => {
  ctx.reply(`@LeahTr.`);
}
);

bot.command('yes', (ctx) => {
  ctx.reply(`No.`);
}
);

bot.command('leah', (ctx) => {
  ctx.reply(`@LeahTr maybe.`);
}
);

bot.command('sorry', (ctx) => {
  ctx.reply(`Yes.`);
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

bot.command(['ben', 'Ben'], (ctx) => {
  ctx.reply(`Dover.
  
https://www.youtube.com/channel/UCRvqjQPSeaWn-uEx-w0XOIg`);
}
);

bot.command(['andrei', 'Andrei'], (ctx) => {
  ctx.reply(`ElonGator. 2.15B.`);
}
);

bot.command('overwhelmed', (ctx) => {
  ctx.reply(`@logabe's kindness!`);
}
);

bot.command('vaffanculo', (ctx) => {
  ctx.reply(`All love. In your ass.`);
}
);

bot.command('renittos', (ctx) => {
  ctx.reply(`$XRP is the way 🚀🚀🚀🚀🚀 🌝 !!!`);
}
);

bot.command('porcodio', (ctx) => {
  let user = getUser(ctx);
  getJoke().then(joke => {
    ctx.reply(
      `Porca madonna di dio cane! 
One for you: ` + joke.joke);
  });
}
);

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

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

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

class CoinMarketCoin {
  name!: string;
  symbol!: string;
  quote!: CoinMarketQuotes;
  timestamp!: Date;
}

class CoinMarketQuotes {
  USD!: CoinMarketQuote;
}

class CoinMarketQuote {
  price!: number;
  volume_24h!: number;
  percent_change_1h!: number;
  percent_change_24h!: number;
  percent_change_7d!: number;
  percent_change_30d!: number;
  percent_change_60d!: number;
  percent_change_90d!: number;
  market_cap!: number;
  last_updated!: Date;
}

class Joke {
  id?: string;
  joke!: string;
}


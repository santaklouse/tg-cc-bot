require('dotenv').config();
var TelegramBot = require('node-telegram-bot-api');

const isInDevMode = !!process.env.DEV_MODE;

const TOKEN = process.env.TELEGRAM_TOKEN;
var token = '738835687:AAHgrICAV5QjEhvlH0ZnTK_dDbE5uXolsxo';

let options = {
    polling: isInDevMode,

};
options.webHook = isInDevMode ? undefined : {
    // Port to which you should bind is assigned to $PORT variable
    // See: https://devcenter.heroku.com/articles/dynos#local-environment-variables
    port: process.env.PORT
    // you do NOT need to set up certificates since Heroku provides
    // the SSL certs already (https://<app-name>.herokuapp.com)
    // Also no need to pass IP because on Heroku you need to bind to 0.0.0.0
};
var bot = new TelegramBot(token, options);

if (!isInDevMode) {
    // Heroku routes from port :443 to $PORT
    // Add URL of your app to env variable or enable Dyno Metadata
    // to get this automatically
    // See: https://devcenter.heroku.com/articles/dyno-metadata
    const url = process.env.APP_URL || 'https://<app-name>.herokuapp.com:443';
    // This informs the Telegram servers of the new webhook.
    // Note: we do not need to pass in the cert, as it already provided
    bot.setWebHook(`${url}/bot${TOKEN}`);
}

var notes = [];
bot.onText(/\/remind (.+) в (.+)/, function(msg, match) {
    var userId = msg.from.id;
    var text = match[1];
    var time = match[2];
    notes.push({
        'uid': userId,
        'time': time,
        'text': text
    });
    bot.sendMessage(userId, 'Super! I\'ll definitely remind you if <b>wont dead</b>b> :)');
});
setInterval(function() {
    for (var i = 0; i < notes.length; i++) {
        var curDate = new Date().getHours() + ':' + new Date().getMinutes();
        if (notes[i]['time'] == curDate) {
            bot.sendMessage(notes[i]['uid'], '<b>Remind:</b> \"' + notes[i]['text'] + '\" now.');
            notes.splice(i, 1);
        }
    }
}, 1000);

// Just to ping!
bot.on('message', function onMessage(msg) {
    bot.sendMessage(msg.chat.id, 'I am alive on Heroku!');
});

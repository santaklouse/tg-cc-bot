
import bot from './tg-bot';
import ipfsNode from './ipfs-node';
import _ from 'lodash';


var chatId;

let app = {
    log: (...msg) => {
        if (chatId) {
            bot.sendMessage(chatId, _.isArray(msg) ? msg.join('<br/>') : msg, {parse_mode: 'HTML'});
        } else {
             _.isArray(msg) ? console.log.apply(console, msg) : console.log(msg)
        }
    }
};

let node = ipfsNode.create();

node.once('start', (err) => {
        node.id().then(data => {
            app.log('start, node.id: ', data, data.id);
        });
    })
    .on('ready', () => {
        app.log('Node is ready to use!')
    })
    .on('error', error => {
        console.error('Something went terribly wrong!', error)
    })
    .on('stop', () => app.log('Node stopped!'));

bot.onText(/\/ipfs status/, function(msg, match) {
    chatId = msg.from.id;
    node.stats.bw((err, stats) => {
        if (err) {
            app.log('An error occurred trying to check our stats:', err)
        }
        app.log(`\nBandwidth Stats: ${JSON.stringify(stats, null, 2)}\n`)
    })
    node.swarm.peers((err, peers) => {
        if (err) {
            app.log('An error occurred trying to check our peers:', err)
            // process.exit(1);
        }
        app.log(`The node now has <b>${peers.length} peers</b>.`)
    })
});

bot.onText(/\/ipfs id/, function(msg, match) {
    chatId = msg.from.id;
    // Listen for the node to start, so we can log out some metrics
    node.id().then(data => {
        // app.log(data, data.id);
        bot.sendMessage(chatId, `IPFS uniq id: <b>${data.id}</b>`, {parse_mode: 'HTML'});
    });
});

bot.onText(/\/ipfs stop/, function(msg, match) {
    chatId = msg.from.id;
    node.stop(() => {
        app.log(`The node <b>STOPPED!</b>.`)
    })
});

bot.onText(/\/ipfs start/, function(msg, match) {
    chatId = msg.from.id;
    node.start(() => {
        app.log(`The node <b>STARTED!</b>.`)
    })
});

bot.onText(/\/ipfs peers/, function(msg, match) {
    chatId = msg.from.id;
    node.swarm.peers((err, peers) => {
        if (err) {
            app.log('An error occurred trying to check our peers:', err)
            // process.exit(1);
        }
        app.log(`The node now has <b>${peers.length} peers</b>.`)
    })
});



// process.on('beforeExit', (code) => {
//     console.log(`beforeExit: About to exit with code: ${code}`);
//     node.shutdown();
// });

process.on('exit', (code) => {
    console.log(`exit: About to exit with code: ${code}`);
    node.shutdown();
});

// process.on('SIGINT', function(code) {
//     console.log(`SIGINT: About to exit with code: ${code}`);
//     node.shutdown();
// });

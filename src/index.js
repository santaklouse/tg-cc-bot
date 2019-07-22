
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

    // Lets log out the number of peers we have every 2 seconds
    setInterval(() => {
        node.id().then(data => {
            app.log('start, node.id: ', data, data.id);
        });
        node.swarm.peers((err, peers) => {
            if (err) {
                app.log('start, swarm.peers: An error occurred trying to check our peers:', err)
                // process.exit(1);
            }
            app.log(`start, swarm.peers: The node now has ${peers.length} peers.`)
        })
    }, 2000);

    // Log out the bandwidth stats every 4 seconds so we can see how our configuration is doing
    setInterval(() => {
        node.stats.bw((err, stats) => {
            if (err) {
                app.log('stats.bw: An error occurred trying to check our stats:', err)
            }
            app.log(`\nBandwidth Stats: ${JSON.stringify(stats, null, 2)}\n`)
        })
    }, 4000)
})
    .on('ready', () => {
        app.log('Node is ready to use!')
        // your instance with WebRTC is ready
    })
    .on('error', error => {
        console.error('Something went terribly wrong!', error)
    })
    .on('stop', () => app.log('Node stopped!'));

bot.onText(/\/ipfs/, function(msg, match) {
    chatId = msg.from.id;
    // Listen for the node to start, so we can log out some metrics
    node.id().then(data => {
        // app.log(data, data.id);
        bot.sendMessage(chatId, `IPFS uniq id: <b>${data.id}</b>`, {parse_mode: 'HTML'});
    });

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

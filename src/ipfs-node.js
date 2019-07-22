import 'bluebird';
// const IPFS = require('ipfs');
// const libp2p = require("libp2p")
// const Id = require("peer-id")
// const Info = require("peer-info")
// const multiaddr = require("multiaddr")
// const pull = require('pull-stream')
//
// const WSStar = require('libp2p-websocket-star')
//
// Id.create((err, id) => {
//     if (err) throw err;
//
//     const peerInfo = new Info(id);
//     peerInfo
//         .multiaddrs
//         .add(multiaddr("/dns4/ws-star-signal-1.servep2p.com/tcp/443/wss/p2p-websocket-star/"));
//
//     // TODO -> review why the ID can not be passed by the .listen call
//     const ws = new WSStar({ id: id }); // the id is required for the crypto challenge
//
//     const modules = {
//         transport: [
//             ws
//         ],
//         discovery: [
//             ws.discovery
//         ]
//     };
//     console.log('id', id.toB58String());
//
// //+id.toB58String()
//     let node = new IPFS({
//         repo: 'your-repo-path',
//         // start: false,
//         config: {
//             Addresses: {
//                 Swarm: [
//                     '/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star'
//                 ]
//             }
//         },
//         libp2p: {
//             modules: modules
//         }
//     });
//     console.log('Init done.');
//
//     node.on('ready', () => {
//         console.log('Node is ready to use!')
//         // your instance with WebRTC is ready
//     });
//     node.on('error', error => {
//         console.error('Something went terribly wrong!', error)
//     });
//     node.on('stop', () => console.log('Node stopped!'));
//
//
// });
'use strict'

const Libp2p = require('libp2p')
const IPFS = require('ipfs')
const TCP = require('libp2p-tcp')
const MulticastDNS = require('libp2p-mdns')
const WebSocketStar = require('libp2p-websocket-star')
const Bootstrap = require('libp2p-bootstrap')
const SPDY = require('libp2p-spdy')
const KadDHT = require('libp2p-kad-dht')
const MPLEX = require('libp2p-mplex')
const SECIO = require('libp2p-secio')
const assert = require('assert')

/**
 * Options for the libp2p bundle
 * @typedef {Object} libp2pBundle~options
 * @property {PeerInfo} peerInfo - The PeerInfo of the IPFS node
 * @property {PeerBook} peerBook - The PeerBook of the IPFS node
 * @property {Object} config - The config of the IPFS node
 * @property {Object} options - The options given to the IPFS node
 */

/**
 * This is the bundle we will use to create our fully customized libp2p bundle.
 *
 * @param {libp2pBundle~options} opts The options to use when generating the libp2p node
 * @returns {Libp2p} Our new libp2p node
 */
const libp2pBundle = (opts) => {
    // Set convenience variables to clearly showcase some of the useful things that are available
    const peerInfo = opts.peerInfo;
    const peerBook = opts.peerBook;
    const bootstrapList = opts.config.Bootstrap;

    // Create our WebSocketStar transport and give it our PeerId, straight from the ipfs node
    const wsstar = new WebSocketStar({
        id: peerInfo.id
    });

    // Build and return our libp2p node
    return new Libp2p({
        peerInfo,
        peerBook,
        // Lets limit the connection managers peers and have it check peer health less frequently
        connectionManager: {
            maxPeers: 250,
            pollInterval: 5000
        },
        modules: {
            transport: [
                TCP,
                // TCP,
                wsstar
            ],
            streamMuxer: [
                MPLEX,
                SPDY
            ],
            connEncryption: [
                SECIO
            ],
            peerDiscovery: [
                MulticastDNS,
                // Bootstrap,
                wsstar.discovery
            ],
            dht: KadDHT
        },
        config: {
            peerDiscovery: {
                mdns: {
                    interval: 10000,
                    enabled: true
                },
                bootstrap: {
                    interval: 10000,
                    enabled: true,
                    list: bootstrapList
                }
            },
            // Turn on relay with hop active so we can connect to more peers
            relay: {
                enabled: true,
                hop: {
                    enabled: true,
                    active: true
                }
            },
            dht: {
                kBucketSize: 20
            },
            EXPERIMENTAL: {
                dht: true,
                pubsub: true
            }
        }
    })
}


export default {
    create: () => {
        // Now that we have our custom libp2p bundle, let's start up the ipfs node!
        return new IPFS({
            config: {
                Addresses: {
                    Swarm: ['/dns4/ws-star.discovery.libp2p.io/tcp/443/wss/p2p-websocket-star']
                },
            },
            libp2p: libp2pBundle
        });
    }
};

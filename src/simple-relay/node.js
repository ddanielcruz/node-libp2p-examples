import chalk from 'chalk'
import { createLibp2p } from 'libp2p'
import { bootstrap } from '@libp2p/bootstrap'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'

// Define bootstrapers with hardcoded local IP and argument one if provided
const bootstrapers = ['/ip4/127.0.0.1/tcp/50000/p2p/12D3KooWLupcacJY4SvhdApBiz6u6ivmmqfdz2Q31Afpm4Si1Zqg']
if (process.argv.length > 2) {
  bootstrapers.push(process.argv[2].trim())
}

// Create node with bootstrap set to relay
const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  pubsub: gossipsub({ allowPublishToZeroPeers: true }),
  peerDiscovery: [
    bootstrap({
      interval: 60e3,
      list: bootstrapers
    }),
    pubsubPeerDiscovery({ interval: 1000 })
  ]
})

node.addEventListener('peer:discovery', async evt => {
  console.debug(chalk.gray('[peer:discovery]'), evt.detail.id.toString())
})

node.addEventListener('peer:connect', async evt => {
  console.debug(chalk.gray('[peer:connect]'), evt.detail.remotePeer.toString())
})

node.addEventListener('peer:disconnect', async evt => {
  console.debug(chalk.gray('[peer:disconnect]'), evt.detail.remotePeer.toString())
})

console.log(chalk.greenBright(`Node listening on:`))
node.getMultiaddrs().forEach(addr => console.log(addr.toString()))
console.log()

await node.start()

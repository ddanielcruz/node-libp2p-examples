import fs from 'node:fs/promises'
import path from 'node:path'

import chalk from 'chalk'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { pubsubPeerDiscovery } from '@libp2p/pubsub-peer-discovery'

// Load hardcoded peer ID from filesystem
const filepath = path.resolve('src', 'simple-relay', 'relay-id.json')
const peerIdData = JSON.parse(await fs.readFile(filepath))
const peerId = await createFromJSON(peerIdData)

// Create a relay node
const relay = await createLibp2p({
  peerId,
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/50000']
  },
  transports: [tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  pubsub: gossipsub({ allowPublishToZeroPeers: true }),
  peerDiscovery: [pubsubPeerDiscovery({ interval: 1000 })],
  relay: {
    enabled: true,
    hop: {
      enabled: true
    },
    advertise: {
      enabled: true
    }
  }
})

relay.addEventListener('peer:discovery', async evt => {
  console.debug(chalk.gray('[peer:discovery]'), evt.detail.id.toString())
})

relay.addEventListener('peer:connect', async evt => {
  console.debug(chalk.gray('[peer:connect]'), evt.detail.remotePeer.toString())
})

relay.addEventListener('peer:disconnect', async evt => {
  console.debug(chalk.gray('[peer:disconnect]'), evt.detail.remotePeer.toString())
})

console.log(chalk.magentaBright(`Relay listening on:`))
relay.getMultiaddrs().forEach(addr => console.log(addr.toString()))
console.log()

await relay.start()

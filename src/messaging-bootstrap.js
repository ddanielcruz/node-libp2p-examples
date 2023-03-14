import { createLibp2p } from 'libp2p'
import { bootstrap } from '@libp2p/bootstrap'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { peerIdFromString } from '@libp2p/peer-id'
import { multiaddr } from '@multiformats/multiaddr'

// IPFS bootstrap addresses
const bootstrapers = [
  '/ip4/104.131.131.82/tcp/4001/p2p/QmaCpDMGvV2BGHeYERUEnRQAwe3N8SzbUtfsmvsqQLuvuJ',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmNnooDu7bfjPFoTZYxMNLWUQJyrVwtbZg5gBMjTezGAJN',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmbLHAnMoJPWSCR5Zhtx6BHJX9KiKNN6tpvbUcqanj75Nb',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmZa1sAxajnQjVM8WjWXoMbmPd7NsWhfKsPkErzpm9wGkp',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmQCU2EcMqAqQPR2i9bChDtGNJchTbq5TbXJJ16u19uLTa',
  '/dnsaddr/bootstrap.libp2p.io/p2p/QmcZf59bWwK5XFi76CZX8cbJ4BhTzzA3gU1ZjYZcYW3dwt'
]

const node = await createLibp2p({
  start: false,
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [
    bootstrap({
      interval: 60e3,
      list: bootstrapers
    })
  ]
})

node.addEventListener('peer:connect', evt => {
  // Emitted when a new connection has been created
  console.log('Connection established to:', evt.detail.remotePeer.toString())
})

node.addEventListener('peer:disconnect', evt => {
  // Emitted when a connection has been closed
  console.log('Connection closed to:', evt.detail.remotePeer.toString())
})

node.addEventListener('peer:discovery', evt => {
  // No need to dial, autoDial is on
  console.log('Discovered:', evt.detail.id.toString())
})

await node.start()

console.log('Node listening on:')
node.getMultiaddrs().forEach(ma => console.log(ma.toString()))
console.log()

// Send message to a peer if provided
if (process.argv.length > 2) {
  const peerId = peerIdFromString(process.argv[2].split('/').at(-1))
  const multiAddr = multiaddr(process.argv[2])
  await node.peerStore.addressBook.set(peerId, [multiAddr])

  while (true) {
    const latency = await node.ping(peerId)
    console.log(`Ping to ${peerId.toString()} took ${latency}ms`)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

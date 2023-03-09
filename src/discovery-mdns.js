import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { mdns } from '@libp2p/mdns'

const node = await createLibp2p({
  addresses: {
    listen: ['/ip4/0.0.0.0/tcp/0']
  },
  transports: [tcp()],
  streamMuxers: [mplex()],
  connectionEncryption: [noise()],
  peerDiscovery: [mdns({ interval: 20e3 })]
})

node.addEventListener('peer:discovery', evt => {
  console.log('[peer:discovery]', evt.detail.id.toString())
})

await node.start()

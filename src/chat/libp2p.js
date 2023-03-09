import { createLibp2p as create } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { webSockets } from '@libp2p/websockets'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'

export async function createLibp2p(options) {
  const defaults = {
    transports: [tcp(), webSockets()],
    streamMuxers: [mplex()],
    connectionEncryption: [noise()]
  }

  return create({ ...options, ...defaults })
}

import process from 'node:process'

import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { peerIdFromString } from '@libp2p/peer-id'
import { mplex } from '@libp2p/mplex'
import { noise } from '@chainsafe/libp2p-noise'
import { multiaddr } from '@multiformats/multiaddr'
import { pipe } from 'it-pipe'
import { toString as uint8ArrayToString } from 'uint8arrays/to-string'
import { fromString as uint8ArrayFromString } from 'uint8arrays/from-string'
import toBuffer from 'it-to-buffer'

// Function to create a libp2p node with TCP transport
async function createNode() {
  return await createLibp2p({
    addresses: {
      listen: ['/ip4/0.0.0.0/tcp/0']
    },
    transports: [tcp()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()]
  })
}

// Print the addresses the node is listening on to the console
function printAddresses(node, number) {
  console.log('node [%s] is listening on:', number)
  node.getMultiaddrs().forEach(ma => console.log(ma.toString()))
}

// Create the node
const node = await createNode()
printAddresses(node, 1)

// Set up a handler for the /print protocol
node.handle('/print', async ({ stream, connection }) => {
  const result = await pipe(
    stream,
    async function* (source) {
      for await (const list of source) {
        yield list.subarray()
      }
    },
    toBuffer
  )
  console.log(`[${connection.remotePeer}]`, uint8ArrayToString(result))
})

// Send message to a peer if provided
if (process.argv.length > 2) {
  const peerId = peerIdFromString(process.argv[2].split('/').at(-1))
  const multiAddr = multiaddr(process.argv[2])
  await node.peerStore.addressBook.set(peerId, [multiAddr])

  while (true) {
    const stream = await node.dialProtocol(peerId, '/print')
    await pipe([uint8ArrayFromString(`Message ${Date.now()}`)], stream)
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
}

let EventEmitter  = require('events');

let WAITING_HEADER  = 0;
let WAITING_PACKET = 1;

class PacketStreamWrapper extends EventEmitter {
  constructor(stream) {
    super();

    this.stream = stream;

    let state = WAITING_HEADER;
    let packetLength = 0;

    let self = this;
    this.stream.on('readable', function() {
        while (true) {
            switch(state) {
                case WAITING_HEADER:
                    let header = stream.read(4);
                    if(header === null) return;
                    packetLength = header.readUInt32BE(0);
                    state = WAITING_PACKET;
                    break;
                case WAITING_PACKET:
                    let packet = stream.read(packetLength);
                    if(packet === null) return;
                    self.emit('packet', packet);
                    state = WAITING_HEADER;
                    break;
            }
        }
    });
  }

  send(buf) {
    let header = Buffer.alloc(4);
    header.writeUInt32BE(buf.length, 0);
    this.stream.write(Buffer.concat([header, buf]));
  }
}

module.exports = PacketStreamWrapper;
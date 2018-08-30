'use strict';

let EventEmitter = require('events');
let util = require('util');
let tls = require('tls');
let debug = require('debug')('castv2');
let protocol = require('./proto');
let PacketStreamWrapper = require('./packet-stream-wrapper');
let Channel = require('./channel');

let CastMessage = protocol.CastMessage;

class Client extends EventEmitter {
    constructor() {
        super();
        this.socket = null;
        this.ps = null;
    }

    connect(options) {
        // here because hoisting is bad
        const onpacket = buf => {
            const message = CastMessage.parse(buf);

            debug(
                'recv message: protocolVersion=%s sourceId=%s destinationId=%s namespace=%s data=%s',
                message.protocol_version,
                message.source_id,
                message.destination_id,
                message.namespace,
                (message.payload_type === 1) // BINARY
                    ? util.inspect(message.payload_binary)
                    : message.payload_utf8
            );
            if (message.protocol_version !== 0) { // CASTV2_1_0
                this.emit('error', new Error('Unsupported protocol version: ' + message.protocol_version));
                this.close();
                return;
            }

            this.emit('message',
                message.source_id,
                message.destination_id,
                message.namespace,
                (message.payload_type === 1) // BINARY
                    ? message.payload_binary
                    : message.payload_utf8
            );
        };

        return new Promise((resolve) => {
            if (typeof options === 'string') {
                options = {
                    host: options
                }
            }

            options.port = options.port || 8009;
            options.rejectUnauthorized = false;

            this.once('connect', resolve);
            debug('connecting to %s:%d ...', options.host, options.port);

            this.socket = tls.connect(options, () => {
                if (this.socket) {
                    this.ps = new PacketStreamWrapper(this.socket);
                    this.ps.on('packet', onpacket);

                    debug('connected');
                    this.emit('connect');
                }
            });

            const onerror = (err) => {
                debug('error: %s %j', err.message, err);
                this.emit('error', err);
            };

            this.socket.on('error', onerror);

            const onclose = () => {
                debug('connection closed');
                this.socket && this.socket.removeListener('error', onerror);
                this.socket = null;
                this.ps && this.ps.removeListener('packet', onpacket);
                this.ps = null;
                this.emit('close');
            };
            this.socket.once('close', onclose);
        });
    }

    close() {
        debug('closing connection ...');
        // using socket.destroy here because socket.end caused stalled connection
        // in case of dongles going brutally down without a chance to FIN/ACK
        if (this.socket) this.socket.destroy();
    }

    send(sourceId, destinationId, namespace, data) {
        const message = {
            protocol_version: 0, // CASTV2_1_0
            source_id: sourceId,
            destination_id: destinationId,
            namespace: namespace
        };

        if (Buffer.isBuffer(data)) {
            message.payload_type = 1; // BINARY
            message.payload_binary = data;
        } else {
            message.payload_type = 0; // STRING
            message.payload_utf8 = data;
        }
        debug(
            'send message: protocolVersion=%s sourceId=%s destinationId=%s namespace=%s data=%s',
            message.protocol_version,
            message.source_id,
            message.destination_id,
            message.namespace,
            (message.payload_type === 1) // BINARY
                ? util.inspect(message.payload_binary)
                : message.payload_utf8
        );

        let buf = CastMessage.serialize(message);
        this.ps.send(buf);
    }

    createChannel(sourceId, destinationId, namespace, encoding) {
        return new Channel(this, sourceId, destinationId, namespace, encoding);
    }
}

module.exports = Client;
'use strict';

let EventEmitter = require('events');
let debug = require('debug')('castv2');

class Channel extends EventEmitter {
    constructor(bus, sourceId, destinationId, namespace, encoding) {
        super();

        this.bus = bus;
        this.sourceId = sourceId;
        this.destinationId = destinationId;
        this.namespace = namespace;
        this.encoding = encoding;


        const onmessage = (sourceId, destinationId, namespace, data) => {
            if (sourceId !== this.destinationId) return;
            if (destinationId !== this.sourceId && destinationId !== '*') return;
            if (namespace !== this.namespace) return;
            this.emit('message', decode(data, this.encoding), destinationId === '*');
        };
        this.bus.on('message', onmessage);

        const onclose = () => {
            this.bus.removeListener('message', onmessage);
            this.bus.removeListener('close', onclose);
            this.removeListener('close', onclose);
        };
        this.bus.once('close', this.close.bind(this));
        this.once('close', onclose);
    }

    send(data) {
        this.bus.send(
            this.sourceId,
            this.destinationId,
            this.namespace,
            encode(data, this.encoding)
        );
    }

    close() {
        this.emit('close');
    }
}

function encode(data, encoding) {
    if (!encoding) return data;
    if (encoding === 'JSON') return JSON.stringify(data);

    throw new Error('Unsupported channel encoding: ' + encoding);
}

function decode(data, encoding) {
    if (!encoding) return data;
    if (encoding === 'JSON') return JSON.parse(data);

    throw new Error('Unsupported channel encoding: ' + encoding);
}

module.exports = Channel;
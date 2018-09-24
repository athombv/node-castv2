'use strict';

const EventEmitter = require('events');

class Channel extends EventEmitter {
  constructor({
    bus, sourceId, destinationId, namespace, encoding,
  }) {
    super();

    this._onMessage = this._onMessage.bind(this);
    this._onClose = this._onClose.bind(this);

    this.bus = bus;
    this.sourceId = sourceId;
    this.destinationId = destinationId;
    this.namespace = namespace;
    this.encoding = encoding;

    this.bus.on('message', this._onMessage);
    this.once('close', this._onClose);
  }

  send(data) {
    this.bus.send(
      {
        sourceId: this.sourceId,
        destinationId: this.destinationId,
        namespace: this.namespace,
        data: this.constructor.encode(data, this.encoding),
      },
    );
  }

  close() {
    this.emit('close');
  }

  _onMessage(sourceId, destinationId, namespace, data) {
    if (sourceId !== this.destinationId) return;
    if (destinationId !== this.sourceId && destinationId !== '*') return;
    if (namespace !== this.namespace) return;
    this.emit('message', this.constructor.decode(data, this.encoding), destinationId === '*');
  }

  _onClose() {
    this.bus.removeListener('message', this._onMessage);
    this.removeListener('close', this._onClose);
  }

  static encode(data, encoding) {
    if (!encoding) return data;
    if (encoding === 'JSON') return JSON.stringify(data);

    throw new Error(`Unsupported channel encoding: ${encoding}`);
  }

  static decode(data, encoding) {
    if (!encoding) return data;
    if (encoding === 'JSON') return JSON.parse(data);

    throw new Error(`Unsupported channel encoding: ${encoding}`);
  }
}

module.exports = Channel;

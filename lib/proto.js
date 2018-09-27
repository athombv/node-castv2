'use strict';

const ProtoBuf = require('protobufjs');
const path = require('path');

const builder = ProtoBuf.loadProtoFile(path.join(__dirname, 'cast_channel.proto'));
const Extensions = builder.build('extensions.api.cast_channel');

const messages = [
  'CastMessage',
  'AuthChallenge',
  'AuthResponse',
  'AuthError',
  'DeviceAuthMessage',
];

messages.forEach((message) => {
  module.exports[message] = {
    serialize: (data) => {
      const msg = new Extensions[message](data);
      return msg.encode().toBuffer();
    },
    parse: (data) => {
      return Extensions[message].decode(data);
    },
  };
});

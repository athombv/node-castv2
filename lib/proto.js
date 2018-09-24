'use strict';

const ProtoBuf  = require("protobufjs");

let builder = ProtoBuf.loadProtoFile(__dirname + "/cast_channel.proto");
let extensions = builder.build('extensions.api.cast_channel');

const messages = [
  'CastMessage',
  'AuthChallenge',
  'AuthResponse',
  'AuthError',
  'DeviceAuthMessage'
];

messages.forEach((message) => {
  module.exports[message] = {
    serialize: (data) => {
      let msg = new extensions[message](data);
      return msg.encode().toBuffer();
    },
    parse: (data) => {
      return extensions[message].decode(data);
    }
  };
});
'use strict';

const Client = require('./lib/client');
const Server = require('./lib/server');
const DeviceAuthMessage = require('./lib/proto').DeviceAuthMessage;

module.exports.Client = Client;
module.exports.Server = Server;
module.exports.DeviceAuthMessage = DeviceAuthMessage;

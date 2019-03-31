const Logger = require('./logger');
const config = require('../conf/config');
// global (gfy)
L = new Logger( config.loglevel || 'warn' );

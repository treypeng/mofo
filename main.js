
const BitMEX = require('./src/drivers/BitMEX');

let bm = new BitMEX();

bm.start();

bm.on( 'connected', c => console.log(c) );
bm.on( 'frame', d => console.log(d) );

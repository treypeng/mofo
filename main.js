
const BitMEX = require('./src/drivers/BitMEX');
const Deribit = require('./src/drivers/Deribit');

let dr = new Deribit();
let bm = new BitMEX();

dr.start();
bm.start();

dr.on( 'connected', c => console.log( c ) );
dr.on( 'frame', f => console.log( f ));

bm.on( 'connected', c => console.log(c) );
bm.on( 'frame', d => console.log(d) );

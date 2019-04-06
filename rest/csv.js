

module.exports = class CSV
{
  constructor()
  {

  }

  _time(v)
  {
    if (!v) return v;
    if (v.toISOString) return v.toISOString();
    return v;
  }

  write(data)
  {
    if (!data.length) return '';

    let keys = [];

    for (let k in data[0])
        keys.push(k);

    let header = keys.join(',') + '\n';

    let lines = data.map ( (function ( d ) {
      let s = '';
      for (let k of keys)
        s += `${this._time(d[k])},`;

      return s.slice(0, s.length-1);
    }).bind(this));


    return header + lines.join('\n');
  }
}
//
// let d = [
//   {a:1, b:2, c:'three'},
//   {a:2, b:3, c:'four'},
//   {a:3, b:4, c:'five'},
// ];
//
// let csv = new CSV();
//
// console.log( csv.write(d) );


// for (let key in d[0])
//   console.log(key);
//
// let lin = d.map( i => `${i.a},${i.b},${i.c}`);
//
// console.log(lin.join('\n'));
//
//
// function

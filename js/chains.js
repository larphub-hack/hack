// larphub jailbreak - firmware routing table.
// Ranges and chain entry points mirror the g2all host so the payload trees
// stay verbatim: 505/ 700/ 900/ css/ slopkit/ plus the goldhen bin at root.

window.LARPHUB = (function () {
  var table = [
    {
      id: '505',
      label: '5.05 / 5.07',
      min: 5.05, max: 5.07,
      script: '505/exploit.js',
      module: false,
      name: 'psfree kernel chain, 5.05',
      need: ''
    },
    {
      id: '700',
      label: '7.00 - 8.52',
      min: 7.00, max: 8.52,
      script: '700/alert.js',
      module: true,
      name: 'psfree kernel chain, 7.00 - 8.52',
      need: ''
    },
    {
      id: '900',
      label: '9.00 - 9.60',
      min: 9.00, max: 9.60,
      script: '900/alert.js',
      module: true,
      name: 'psfree kernel chain, 9.00 - 9.60',
      need: 'usb drive with the exfathax image inserted before sending'
    },
    {
      id: '1000',
      label: '10.00 - 11.02',
      min: 10.00, max: 11.02,
      script: 'css/main.js',
      module: false,
      entry: 'doJb',
      name: 'kernel chain, 10.00 - 11.02',
      need: ''
    },
    {
      id: '1150',
      label: '11.50 - 11.52',
      min: 11.50, max: 11.52,
      script: 'slopkit/chain_lapse.js',
      module: true,
      name: 'lapse chain, 11.50 - 11.52',
      need: ''
    },
    {
      id: '1200',
      label: '12.00 - 14.02',
      min: 12.00, max: 14.02,
      script: 'slopkit/jb.js',
      module: true,
      name: 'slopkit chain, 12.00 - 14.02',
      need: ''
    }
  ];

  function resolve(version) {
    if (version === null || isNaN(version)) return null;
    for (var i = 0; i < table.length; i++) {
      var c = table[i];
      if (version >= c.min - 0.001 && version <= c.max + 0.001) return c;
    }
    return null;
  }

  return { table: table, resolve: resolve };
})();

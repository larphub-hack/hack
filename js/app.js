// larphub jailbreak - host page, chain launch, fullscreen log.
// ES5 on purpose: the ps4 browser is old.
//
// The appcache lives on cache.html, exactly like the g2all host: first open
// with status 0 sends this document there, and once the pack is stored this
// page is served from the cache, so status is no longer 0.

(function () {
  'use strict';

  var UA = navigator.userAgent || '';
  var match = UA.match(/PlayStation 4[\/ ](\d+\.\d+)/i);
  var isPS4 = match !== null;
  var fwStr = match ? match[1] : null;
  var fw = fwStr ? parseFloat(fwStr) : null;
  var chain = window.LARPHUB ? window.LARPHUB.resolve(fw) : null;

  function $(id) { return document.getElementById(id); }

  var ui = {
    fwChip: $('fwChip'),
    cacheChip: $('cacheChip'),
    jbBtn: $('jbBtn'),
    verLine: $('verLine'),
    jbNote: $('jbNote'),
    logScreen: $('logScreen'),
    log: $('log'),
    chainState: $('chainState'),
    logVer: $('logVer'),
    logClose: $('logClose'),
    msgs: $('msgs'),
    hostInfo: $('hostInfo')
  };

  var state = {
    running: false,
    used: false,
    chainOk: false,
    lastMsg: ''
  };
  var timers = {};

  // ---- helpers ------------------------------------------------------------

  function stamp() {
    var d = new Date();
    function p(n) { return n < 10 ? '0' + n : '' + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }

  function log(msg, kind) {
    var line = document.createElement('div');
    var t = document.createElement('span');
    t.className = 't';
    t.textContent = stamp();
    var body = document.createElement('span');
    body.className = 'l-' + (kind || 'info');
    body.textContent = msg;
    line.appendChild(t);
    line.appendChild(body);
    ui.log.appendChild(line);
    while (ui.log.childNodes.length > 400) ui.log.removeChild(ui.log.firstChild);
    ui.log.scrollTop = ui.log.scrollHeight;
  }

  function chip(el, text, kind) {
    el.textContent = text;
    el.className = 'chip' + (kind ? ' ' + kind : '');
  }

  function chainState(text, kind) {
    ui.chainState.textContent = text;
    ui.chainState.className = 'state' + (kind ? ' ' + kind : '');
  }

  function consoleLine() {
    return isPS4 ? 'PlayStation 4 \u2014 firmware ' + fwStr : 'desktop preview \u2014 no console detected';
  }

  function showClose() {
    ui.logClose.className = 'mini';
  }

  function mainReady() {
    ui.verLine.textContent = consoleLine();
    ui.logVer.textContent = consoleLine();

    if (state.chainOk) {
      ui.jbBtn.disabled = false;
      ui.jbNote.textContent = 'one press runs the chain, the log opens fullscreen';
      chip(ui.cacheChip, 'pack ready', 'ok');
    } else if (!isPS4) {
      ui.jbBtn.disabled = true;
      ui.jbNote.textContent = 'open this host from the ps4 browser to run a chain';
      chip(ui.cacheChip, 'pack n/a');
    } else {
      ui.jbBtn.disabled = true;
      ui.jbNote.textContent = 'no chain for firmware ' + fwStr;
      chip(ui.cacheChip, 'pack n/a');
    }
  }

  // ---- fullscreen log -----------------------------------------------------

  function showLog() {
    ui.logScreen.className = 'screen logscreen';
    chainState('sending', 'live');
  }

  // ---- chain launch -------------------------------------------------------

  function runChain() {
    if (!state.chainOk || state.running) return;

    // module scripts execute once per document, so a second press reloads the
    // page (served from the pack) instead of re-injecting a dead URL
    if (state.used) {
      location.reload();
      return;
    }
    state.used = true;
    state.running = true;

    showLog();
    ui.jbBtn.disabled = true;
    ui.jbBtn.className = 'jb busy';
    ui.jbBtn.textContent = 'running';

    log('press registered, arming chain', 'blue');
    log('firmware ' + fwStr + ' routed to ' + chain.script, 'info');
    if (chain.need) log('requirement: ' + chain.need, 'warn');

    var s = document.createElement('script');
    if (chain.module) s.type = 'module';
    s.src = chain.script;
    s.async = true;
    s.onload = function () {
      log('chain entry resident, userland exploit started', 'ok');
      log('escalating to kernel - rw, rop, patches', 'info');
      chainState('running', 'live');
      ui.jbNote.textContent = 'do not touch the console until goldhen reports or the browser drops';

      // the 10.00-11.02 chain only defines doJb(), the host has to call it
      if (chain.entry && typeof window[chain.entry] === 'function') {
        log('calling ' + chain.entry + '()', 'info');
        setTimeout(function () {
          try { window[chain.entry](); } catch (e) {
            log('entry threw: ' + (e && e.message ? e.message : e), 'bad');
          }
        }, 500);
      }
    };
    s.onerror = function () {
      state.running = false;
      ui.jbBtn.disabled = false;
      ui.jbBtn.className = 'jb';
      ui.jbBtn.textContent = 'retry';
      chainState('failed', 'bad');
      ui.jbNote.textContent = 'payload tree missing or blocked';
      showClose();
      log('could not load ' + chain.script, 'bad');
      log('check that the fw tree sits next to index.html and the pack is cached', 'warn');
    };
    document.head.appendChild(s);

    setTimeout(function () {
      if (state.running) log('still executing - kernel chains sit here 20-60s', 'info');
    }, 8000);

    setTimeout(function () {
      if (state.running) log('no status yet - 9.00 and up can take a full minute', 'warn');
    }, 25000);

    setTimeout(function () {
      if (state.running) {
        state.running = false;
        ui.jbBtn.disabled = false;
        ui.jbBtn.className = 'jb';
        ui.jbBtn.textContent = 'reload and retry';
        chainState('stalled', 'bad');
        ui.jbNote.textContent = 'no result after 90s - press again to reload and retry';
        showClose();
        log('no result after 90s - page alive means the chain likely failed', 'warn');
        log('press again to reload from cache and run a fresh attempt', 'info');
      }
    }, 90000);
  }

  // ---- wiring -------------------------------------------------------------

  ui.jbBtn.addEventListener('click', runChain);

  ui.logClose.addEventListener('click', function () {
    ui.logScreen.className = 'screen logscreen hidden';
  });

  // chains write their status into #msgs; mirror it into the log
  setInterval(function () {
    var text = ui.msgs.textContent;
    if (!text || text === state.lastMsg) return;
    state.lastMsg = text;

    var bad = /fail|error/i.test(text);
    var done = /loaded/i.test(text);

    log('chain: ' + text, bad ? 'bad' : 'ok');

    if (bad) {
      chainState('failed', 'bad');
      state.running = false;
      ui.jbBtn.disabled = false;
      ui.jbBtn.className = 'jb';
      ui.jbBtn.textContent = 'retry';
      ui.jbNote.textContent = 'reload the browser and try the chain again';
      showClose();
      return;
    }
    if (/already/i.test(text)) {
      chainState('loaded', 'ok');
      state.running = false;
      ui.jbBtn.disabled = false;
      ui.jbBtn.className = 'jb';
      ui.jbBtn.textContent = 'reload';
      ui.jbNote.textContent = 'goldhen already loaded - games are patched';
      showClose();
      return;
    }
    if (done) {
      chainState('loaded', 'ok');
      state.running = false;
      ui.jbBtn.disabled = false;
      ui.jbBtn.className = 'jb';
      ui.jbBtn.textContent = 'reload';
      ui.jbNote.textContent = 'jailbroken - install a payload manager or launch a game';
      showClose();
      log('jailbreak complete', 'ok');
    }
  }, 700);

  // ---- boot ---------------------------------------------------------------

  ui.hostInfo.textContent = location.host || 'file://';
  ui.verLine.textContent = consoleLine();
  ui.logVer.textContent = consoleLine();
  log('larphub jailbreak boot', 'blue');

  if (!isPS4) {
    chip(ui.fwChip, 'not a ps4', 'warn');
    mainReady();
  } else if (!window.LARPHUB || !chain) {
    chip(ui.fwChip, 'fw ' + fwStr, 'bad');
    mainReady();
  } else {
    chip(ui.fwChip, 'fw ' + fwStr, 'blue');
    state.chainOk = true;
    if (chain.need) ui.jbNote.textContent = 'needs: ' + chain.need;

    var ac = null;
    try { ac = window.applicationCache; } catch (e) { ac = null; }

    // status 0 means this document has no cache behind it yet - install first.
    // one bounce only, so a browser that never associates can't loop forever.
    if (!ac || ac.status === 0) {
      var bounced = false;
      try { bounced = sessionStorage.getItem('larphub-bounce') === '1'; } catch (e) {}
      if (!bounced) {
        try { sessionStorage.setItem('larphub-bounce', '1'); } catch (e) {}
        location.replace('cache.html');
        return;
      }
      log('cache still not attached - running without the offline pack', 'warn');
      mainReady();
      return;
    }

    try { sessionStorage.removeItem('larphub-bounce'); } catch (e) {}

    log('firmware ' + fwStr + ' -> ' + chain.script, 'info');
    mainReady();
  }

  if (!isPS4 && 'serviceWorker' in navigator && location.protocol !== 'file:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
})();

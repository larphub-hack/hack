// Runs on cache.html, the only document that owns the appcache manifest.
// Same mechanism as the g2all host: the cache page installs, then the host
// page (listed in the manifest) is served from cache on every later open.

(function () {
  'use strict';

  var pctEl = document.getElementById('bootPct');
  var barEl = document.getElementById('bootBar');
  var noteEl = document.getElementById('bootNote');
  var retryEl = document.getElementById('bootRetry');

  var finished = false;

  function note(t) { noteEl.textContent = t; }

  function pct(v) {
    pctEl.textContent = v === null ? '...' : Math.round(v) + '%';
  }

  function bar(v) {
    barEl.className = 'bar';
    barEl.style.width = (v > 0 ? v : 2) + '%';
  }

  function done() {
    if (finished) return;
    finished = true;
    clearTimeout(watch);
    pct(100);
    bar(100);
    barEl.className = 'bar frozen';
    note('cache installed - opening the host');
    setTimeout(function () { location.replace('index.html'); }, 600);
  }

  function fail(t) {
    if (finished) return;
    finished = true;
    clearTimeout(watch);
    pctEl.textContent = '--';
    barEl.className = 'bar frozen';
    note(t);
    retryEl.className = 'mini cache-retry';
  }

  var watch = setTimeout(function () {
    fail('no cache events - the manifest did not answer, reload to retry');
  }, 20000);

  retryEl.addEventListener('click', function () { location.reload(); }, false);

  var ac = null;
  try { ac = window.applicationCache; } catch (e) { ac = null; }

  if (!ac) {
    fail('appcache is not available in this browser');
    return;
  }

  ac.addEventListener('checking', function () {
    note('checking the offline pack');
  }, false);

  ac.addEventListener('downloading', function () {
    note('downloading the chain tree - keep the browser open');
  }, false);

  ac.addEventListener('progress', function (e) {
    var loaded = e.loaded || 0;
    var total = e.total || 0;
    if (total > 0) {
      var p = Math.round(loaded / total * 100);
      pct(p);
      bar(p);
    } else {
      barEl.className = 'bar indet';
      pct(null);
    }
  }, false);

  ac.addEventListener('cached', done, false);
  ac.addEventListener('noupdate', done, false);
  ac.addEventListener('updateready', function () {
    try { ac.swapCache(); } catch (e) {}
    done();
  }, false);

  ac.addEventListener('error', function () {
    fail('install error - a listed file failed to fetch, clear browser data and reload');
  }, false);

  ac.addEventListener('obsolete', function () {
    fail('cache went obsolete - reload to rebuild it');
  }, false);

  // already installed on this console: straight back to the host
  if (ac.status === 1) {
    done();
  } else if (ac.status === 4) {
    try { ac.swapCache(); } catch (e) {}
    done();
  }
})();

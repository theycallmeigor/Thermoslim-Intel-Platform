// Vimeo VTT Caption Interceptor — Bookmarklet (v2)
//
// TWO MODES:
// A) Run on the PARENT page (with Vimeo embeds) → finds all iframes, opens player in new tab
// B) Run on the VIMEO PLAYER page directly → patches XHR/fetch, intercepts VTTs
//
// USAGE:
// 1. Go to page with Vimeo embed → click bookmark → it opens the player in a new tab
// 2. On the new tab (player.vimeo.com) → click bookmark again → panel appears
// 3. Play video, enable captions → VTTs captured
// 4. Click "Download All"

(function() {
  'use strict';

  var isVimeoPlayer = location.hostname.indexOf('vimeo') !== -1;

  // === MODE A: Parent page — extract iframe URLs ===
  if (!isVimeoPlayer) {
    var iframes = document.querySelectorAll('iframe[src*="vimeo"]');
    if (iframes.length === 0) {
      alert('No Vimeo iframes found on this page.');
      return;
    }
    var urls = [];
    iframes.forEach(function(f) {
      var src = f.src || f.getAttribute('data-src') || '';
      if (src) urls.push(src);
    });
    if (urls.length === 0) {
      alert('Found iframes but no src URLs.');
      return;
    }
    // Open each in a new tab
    urls.forEach(function(u) {
      window.open(u, '_blank');
    });
    alert('Opened ' + urls.length + ' Vimeo player tab(s).\n\nNow click this bookmark again on each player tab to start intercepting.');
    return;
  }

  // === MODE B: On Vimeo player page — intercept everything ===

  var captured = [];

  // --- UI ---
  var panel = document.createElement('div');
  panel.innerHTML = '<div style="position:fixed;top:10px;right:10px;z-index:999999;background:#1a1a2e;color:#0ff;font-family:monospace;font-size:12px;padding:12px;border-radius:8px;max-width:420px;max-height:80vh;overflow-y:auto;box-shadow:0 0 20px rgba(0,255,255,0.3);border:1px solid #0ff;">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong style="font-size:14px;">VTT Interceptor</strong><span id="vtt-count" style="background:#0ff;color:#000;padding:2px 8px;border-radius:4px;">0</span></div>'
    + '<div id="vtt-status" style="color:#7f8;margin-bottom:8px;">Patched. Enable captions + play video.</div>'
    + '<div id="vtt-list" style="max-height:300px;overflow-y:auto;"></div>'
    + '<div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">'
    + '<button id="vtt-download" style="background:#0ff;color:#000;border:none;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:monospace;font-weight:bold;">Download All</button>'
    + '<button id="vtt-copy" style="background:#333;color:#0ff;border:1px solid #0ff;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:monospace;">Copy URLs</button>'
    + '<button id="vtt-trigger" style="background:#333;color:#7f8;border:1px solid #7f8;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:monospace;">Force Captions</button>'
    + '<button id="vtt-scan" style="background:#333;color:#ff0;border:1px solid #ff0;padding:6px 12px;border-radius:4px;cursor:pointer;font-family:monospace;">Scan Config</button>'
    + '</div></div>';
  document.body.appendChild(panel);

  var countEl = document.getElementById('vtt-count');
  var statusEl = document.getElementById('vtt-status');
  var listEl = document.getElementById('vtt-list');

  function addCapture(url, content) {
    for (var k = 0; k < captured.length; k++) {
      if (captured[k].url === url) return;
    }
    captured.push({ url: url, content: content, timestamp: new Date().toISOString() });
    countEl.textContent = captured.length;
    statusEl.textContent = 'Captured ' + captured.length + ' VTT file(s)';
    statusEl.style.color = '#0f0';
    var entry = document.createElement('div');
    entry.style.cssText = 'padding:4px 0;border-bottom:1px solid #333;word-break:break-all;';
    var short = url.length > 60 ? url.substring(0, 60) + '...' : url;
    var size = content ? (content.length / 1024).toFixed(1) + 'KB' : '?';
    entry.innerHTML = '<span style="color:#ff0;">[' + captured.length + ']</span> ' + short + ' <span style="color:#888;">(' + size + ')</span>';
    listEl.appendChild(entry);
  }

  function isCaptionUrl(url) {
    if (!url) return false;
    var l = url.toLowerCase();
    return l.indexOf('.vtt') !== -1 ||
      l.indexOf('texttrack') !== -1 ||
      l.indexOf('text_track') !== -1 ||
      l.indexOf('/captions') !== -1 ||
      l.indexOf('/subtitles') !== -1;
  }

  // --- Patch XMLHttpRequest (same-origin now!) ---
  var origOpen = XMLHttpRequest.prototype.open;
  var origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function(method, url) {
    this._vttUrl = url;
    return origOpen.apply(this, arguments);
  };

  XMLHttpRequest.prototype.send = function() {
    var self = this;
    if (isCaptionUrl(this._vttUrl)) {
      this.addEventListener('load', function() {
        addCapture(self._vttUrl, self.responseText);
      });
    }
    return origSend.apply(this, arguments);
  };

  // --- Patch fetch ---
  var origFetch = window.fetch;
  window.fetch = function(input, init) {
    var url = typeof input === 'string' ? input : (input && input.url) || '';
    var p = origFetch.apply(this, arguments);
    if (isCaptionUrl(url)) {
      p.then(function(res) {
        return res.clone().text().then(function(text) {
          addCapture(url, text);
        });
      }).catch(function() {});
    }
    return p;
  };

  // --- PerformanceObserver fallback ---
  try {
    new PerformanceObserver(function(list) {
      var entries = list.getEntries();
      for (var j = 0; j < entries.length; j++) {
        var name = entries[j].name;
        if (isCaptionUrl(name)) {
          (function(captureUrl) {
            var already = false;
            for (var k = 0; k < captured.length; k++) {
              if (captured[k].url === captureUrl) { already = true; break; }
            }
            if (!already) {
              fetch(captureUrl).then(function(r) { return r.text(); }).then(function(text) {
                addCapture(captureUrl, text);
              }).catch(function() {
                addCapture(captureUrl, null);
              });
            }
          })(name);
        }
      }
    }).observe({ entryTypes: ['resource'] });
  } catch(e) {}

  // --- Scan Config: parse playerConfig from the page for text_tracks ---
  document.getElementById('vtt-scan').addEventListener('click', function() {
    statusEl.textContent = 'Scanning page for playerConfig...';
    statusEl.style.color = '#ff0';

    // Try to find config in page scripts or global vars
    var config = null;

    // Check window.playerConfig
    try { if (window.playerConfig) config = window.playerConfig; } catch(e) {}

    // Check all script tags
    if (!config) {
      var scripts = document.querySelectorAll('script');
      for (var s = 0; s < scripts.length; s++) {
        var text = scripts[s].textContent || '';
        var match = text.match(/playerConfig\s*=\s*(\{[\s\S]+?\})\s*;/);
        if (match) {
          try { config = JSON.parse(match[1]); } catch(e) {}
        }
        if (!config) {
          match = text.match(/var\s+config\s*=\s*(\{[\s\S]+?\})\s*;/);
          if (match) {
            try { config = JSON.parse(match[1]); } catch(e) {}
          }
        }
      }
    }

    // Deep search for text_tracks
    function findTracks(obj, depth) {
      if (!obj || depth > 8) return null;
      if (typeof obj !== 'object') return null;
      if (Array.isArray(obj)) {
        for (var a = 0; a < obj.length; a++) {
          var r = findTracks(obj[a], depth + 1);
          if (r) return r;
        }
        return null;
      }
      if (obj.text_tracks && Array.isArray(obj.text_tracks)) return obj.text_tracks;
      var keys = Object.keys(obj);
      for (var k = 0; k < keys.length; k++) {
        var r2 = findTracks(obj[keys[k]], depth + 1);
        if (r2) return r2;
      }
      return null;
    }

    if (config) {
      var tracks = findTracks(config, 0);
      if (tracks && tracks.length > 0) {
        statusEl.textContent = 'Found ' + tracks.length + ' track(s) in config! Downloading...';
        statusEl.style.color = '#0f0';
        tracks.forEach(function(track) {
          var trackUrl = track.url || track.direct_url || track.src || '';
          if (!trackUrl) return;
          // Make absolute if relative
          if (trackUrl.charAt(0) === '/') {
            trackUrl = location.origin + trackUrl;
          }
          var lang = track.lang || track.language || 'unknown';
          statusEl.textContent = 'Fetching ' + lang + ' track...';
          fetch(trackUrl).then(function(r) { return r.text(); }).then(function(text) {
            addCapture(trackUrl, text);
          }).catch(function(err) {
            statusEl.textContent = 'Failed to fetch ' + lang + ': ' + err.message;
            statusEl.style.color = '#f00';
          });
        });
      } else {
        statusEl.textContent = 'Config found but no text_tracks array.';
        statusEl.style.color = '#f00';
      }
    } else {
      statusEl.textContent = 'No playerConfig found on this page.';
      statusEl.style.color = '#f00';
    }
  });

  // --- Force Captions: try enabling via Vimeo Player API ---
  document.getElementById('vtt-trigger').addEventListener('click', function() {
    statusEl.textContent = 'Trying to enable text tracks...';
    statusEl.style.color = '#ff0';

    // If we're on the player page, try the player object directly
    var langs = ['en', 'en-x-autogen', 'en-US', 'es', 'fr', 'de', 'pt'];

    // Method 1: Direct Vimeo player object on this page
    try {
      var playerEl = document.querySelector('.player') || document.querySelector('[data-player]') || document.body;
      if (window.Vimeo && window.Vimeo.Player) {
        var player = new Vimeo.Player(playerEl);
        langs.forEach(function(lang) {
          player.enableTextTrack(lang, 'captions').catch(function() {});
          player.enableTextTrack(lang, 'subtitles').catch(function() {});
        });
        statusEl.textContent = 'enableTextTrack called for ' + langs.length + ' languages. Wait...';
        return;
      }
    } catch(e) {}

    // Method 2: Find the internal player reference
    try {
      var vid = document.querySelector('video');
      if (vid && vid.textTracks) {
        for (var i = 0; i < vid.textTracks.length; i++) {
          vid.textTracks[i].mode = 'showing';
          statusEl.textContent = 'Enabled textTrack[' + i + ']: ' + vid.textTracks[i].language;
        }
        if (vid.textTracks.length === 0) {
          statusEl.textContent = 'No textTracks on <video> element.';
          statusEl.style.color = '#f00';
        }
        return;
      }
    } catch(e) {}

    statusEl.textContent = 'Could not find player API. Try Scan Config instead.';
    statusEl.style.color = '#f00';
  });

  // --- Download All ---
  document.getElementById('vtt-download').addEventListener('click', function() {
    if (captured.length === 0) {
      statusEl.textContent = 'Nothing captured yet!';
      statusEl.style.color = '#f00';
      return;
    }
    captured.forEach(function(cap, idx) {
      if (!cap.content) return;
      var blob = new Blob([cap.content], { type: 'text/vtt' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      var langMatch = cap.url.match(/[/.](\w{2}(?:-\w+)?)\./);
      var lang = langMatch ? langMatch[1] : 'track' + idx;
      a.download = 'caption_' + lang + '_' + idx + '.vtt';
      a.click();
      URL.revokeObjectURL(a.href);
    });

    // Combined plain text
    var allText = captured
      .filter(function(c) { return c.content; })
      .map(function(c) {
        return c.content
          .replace(/WEBVTT[\s\S]*?\n\n/, '')
          .replace(/\d{2}:\d{2}:\d{2}\.\d{3}\s*-->\s*\d{2}:\d{2}:\d{2}\.\d{3}\s*\n?/g, '')
          .replace(/<[^>]*>/g, '')
          .split('\n')
          .filter(function(l) { return l.trim(); })
          .filter(function(v, i, a) { return a.indexOf(v) === i; })
          .join('\n');
      }).join('\n\n---\n\n');

    var textBlob = new Blob([allText], { type: 'text/plain' });
    var a2 = document.createElement('a');
    a2.href = URL.createObjectURL(textBlob);
    a2.download = 'captions_combined.txt';
    a2.click();
    URL.revokeObjectURL(a2.href);
    statusEl.textContent = 'Downloaded ' + captured.length + ' file(s) + combined text';
  });

  // --- Copy URLs ---
  document.getElementById('vtt-copy').addEventListener('click', function() {
    var urls = captured.map(function(c) { return c.url; }).join('\n');
    navigator.clipboard.writeText(urls).then(function() {
      statusEl.textContent = 'URLs copied to clipboard!';
    }).catch(function() {
      prompt('Copy these URLs:', urls);
    });
  });

  console.log('[VTT Interceptor v2] Active on Vimeo player. Enable captions + play video.');
})();

// Paste this in DevTools Console on the AdsRx lesson page.
// It extracts Vimeo caption URLs from all embedded players.

(async () => {
  const iframes = document.querySelectorAll('iframe[src*="vimeo"]');
  if (!iframes.length) { console.log('No Vimeo iframes found'); return; }

  for (const iframe of iframes) {
    const src = iframe.src;
    const m = src.match(/video\/(\d+)\??(.*)/);
    if (!m) continue;

    const videoId = m[1];
    const params = m[2];
    const url = `https://player.vimeo.com/video/${videoId}?${params}`;

    console.log(`\n=== Video ${videoId} ===`);
    console.log(`Fetching: ${url}`);

    try {
      const res = await fetch(url, { credentials: 'include', headers: { 'Accept': 'text/html' } });
      const html = await res.text();
      const trackMatch = html.match(/"text_tracks":\s*(\[.*?\])/);

      if (trackMatch) {
        const tracks = JSON.parse(trackMatch[1]);
        console.log(`Found ${tracks.length} tracks:`);
        tracks.forEach(t => {
          console.log(`  ${t.lang} (${t.kind}): ${t.url}`);
        });
        // Copy-friendly output
        console.log('\n--- PASTE THIS BACK ---');
        console.log(JSON.stringify(tracks.map(t => ({ lang: t.lang, url: t.url })), null, 2));
      } else {
        console.log('No text_tracks found in config');
        console.log(`HTTP status: ${res.status}`);
      }
    } catch (e) {
      console.log(`Error: ${e.message}`);
    }
  }
})();

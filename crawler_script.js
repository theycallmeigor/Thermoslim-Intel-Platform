const fs = require('fs');
const path = require('path');
const https = require('https');
const cheerio = require('cheerio');
const TurndownService = require('turndown');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  codeBlockStyle: 'fenced'
});

const BASE_DIR = path.join(__dirname, 'docs', 'integrations', 'loop-subscriptions', 'knowledge-base');

function slugify(text) {
  let res = text.toLowerCase().replace(/\s+/g, '-');
  return res.replace(/[^a-z0-9\-]/g, '');
}

async function fetchHtml(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchHtml(res.headers.location).then(resolve).catch(reject);
      }
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

function processContent(html, url, collection) {
  const $ = cheerio.load(html);
  
  const titleText = $('title').text() || $('meta[property="og:title"]').attr('content') || '';
  const title = titleText.split('|')[0].trim();
  
  const description = $('meta[property="og:description"]').attr('content') || '';
  
  // Find main article body. Usually <article> or #main-content or text inside the page. 
  const articleBody = $('article').html() || $('#main-content').html() || $('main').html() || '';
  
  let markdown = turndownService.turndown(articleBody);
  
  // Clean up markdown
  markdown = markdown.replace(/\[email protected\]/g, "");
  
  const slug = url.split('/').pop().replace(/^\d+-/, '') || slugify(title);
  
  const frontmatter = `---
title: "${title}"
source_url: "${url}"
collection: "${collection}"
scraped_at: "${new Date().toISOString()}"
tags: ["${collection}"]
---

${description}

${markdown}
`;

  return { slug, content: frontmatter };
}

async function main() {
  const jsonRaw = fs.readFileSync('/tmp/all_urls.json', 'utf-8');
  const collections = JSON.parse(jsonRaw);

  let successCount = 0;
  let failCount = 0;

  for (const c of collections) {
    const colName = c.collection;
    const colDir = path.join(BASE_DIR, colName);
    
    if (!fs.existsSync(colDir)) {
      fs.mkdirSync(colDir, { recursive: true });
    }

    const urls = c.url;
    console.log(`Processing collection: ${colName} (${urls.length} URLs)`);

    // We can process in batches or sequentially. We will do chunks of 5
    for (let i = 0; i < urls.length; i += 5) {
      const chunk = urls.slice(i, i + 5);
      await Promise.all(chunk.map(async (url) => {
        try {
          const html = await fetchHtml(url);
          const { slug, content } = processContent(html, url, colName);
          const outFile = path.join(colDir, `${slug}.md`);
          fs.writeFileSync(outFile, content);
          console.log(`✅ Saved ${outFile.replace(BASE_DIR, '')}`);
          successCount++;
        } catch (err) {
          console.error(`❌ Failed ${url}: ${err.message}`);
          failCount++;
        }
      }));
    }
  }

  console.log(`\nFinished crawling! Success: ${successCount}, Failed: ${failCount}`);
  
  // Quick update of the log
  fs.appendFileSync(path.join(BASE_DIR, '_CRAWL_LOG.md'), `\n- Processed ${successCount} articles automatically from node script. Failures: ${failCount}.\n`);
}

main().catch(console.error);

#!/usr/bin/env python3
"""Write jaygallery/feed.xml: an RSS feed holding the gallery's newest project.

Reads the CH and P lists and the JSON-LD descriptions straight out of
jaygallery/index.html, picks the chapter with the latest `added` date and
puts every photo of that set in the item. Run it after adding a set:

    python3 .claude/make-gallery-feed.py
"""
import json
import os
import re
from datetime import datetime, timezone
from email.utils import format_datetime
from html import escape
from zoneinfo import ZoneInfo

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGE = os.path.join(ROOT, 'jaygallery', 'index.html')
OUT = os.path.join(ROOT, 'jaygallery', 'feed.xml')
SITE = 'https://wcloud.nz'
GALLERY = SITE + '/jaygallery'


def js_str(s):
    # the page writes non-ASCII as \u escapes, which JSON reads the same way
    return json.loads('"' + s.replace('"', '\\"') + '"')


html = open(PAGE, encoding='utf-8').read()

chapters = []
for m in re.finditer(r"\{ n: '([IVX]+)',\s*title: '([^']*)',\s*sub: '([^']*)',\s*project: '([^']*)',\s*id: '([^']*)',\s*added: '([^']*)' \}", html):
    n, title, sub, project, cid, added = (js_str(g) for g in m.groups())
    chapters.append(dict(n=n, title=title, sub=sub, project=project, id=cid, added=added, ci=len(chapters)))
if not chapters:
    raise SystemExit('No chapters found in ' + PAGE)

photos = [dict(f=f, w=int(w), h=int(h), ch=int(ch))
          for f, w, h, ch in re.findall(r"\['(\w+)',(\d+),(\d+),'[^']*',(\d+)\]", html)]

ld = json.loads(re.search(r'<script type="application/ld\+json">(.*?)</script>', html, re.S).group(1))
works = [w for g in ld['@graph'] for w in g.get('hasPart', [])]

# newest by date; on a tie the one further down the page wins, as on the page itself
latest = max(chapters, key=lambda c: (c['added'], c['ci']))
shots = [p for p in photos if p['ch'] == latest['ci']]
about = next((w['description'] for w in works if w['name'].startswith(latest['title'])), '')

link = GALLERY + '#' + latest['id']
nz = ZoneInfo('Pacific/Auckland')
published = datetime.fromisoformat(latest['added']).replace(hour=9, tzinfo=nz)
img = lambda p: GALLERY + '/img/' + p['f'] + '.jpg'

lines = [x for x in (latest['sub'], 'Project: ' + latest['project']) if x]
body = ''.join('<p>' + escape(x, quote=False) + '</p>' for x in lines)
if about:
    body += '<p>' + escape(about, quote=False) + '</p>'
for k, p in enumerate(shots, 1):
    alt = '%s, photograph %d of %d' % (latest['title'], k, len(shots))
    body += '<p><img src="%s" width="%d" height="%d" alt="%s"></p>' % (img(p), p['w'], p['h'], escape(alt))
body += '<p><a href="%s">See %s in the gallery</a></p>' % (link, escape(latest['title']))

summary = ' '.join(x for x in (about, '%d photographs.' % len(shots)) if x)
cover = shots[0]
size = os.path.getsize(os.path.join(ROOT, 'jaygallery', 'img', cover['f'] + '.jpg'))

feed = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>Jay D Vera, new work</title>
    <link>{GALLERY}</link>
    <atom:link href="{GALLERY}/feed.xml" rel="self" type="application/rss+xml"/>
    <description>The newest photography set from Jay D Vera, photographer and content creator in Christchurch, New Zealand.</description>
    <language>en-nz</language>
    <lastBuildDate>{format_datetime(datetime.now(timezone.utc))}</lastBuildDate>
    <item>
      <title>{escape(latest['title'], quote=False)}</title>
      <link>{link}</link>
      <guid isPermaLink="false">{link}</guid>
      <pubDate>{format_datetime(published)}</pubDate>
      <description>{escape(summary, quote=False)}</description>
      <content:encoded><![CDATA[{body}]]></content:encoded>
      <enclosure url="{img(cover)}" length="{size}" type="image/jpeg"/>
      <media:content url="{img(cover)}" medium="image" type="image/jpeg" width="{cover['w']}" height="{cover['h']}"/>
    </item>
  </channel>
</rss>
'''
open(OUT, 'w', encoding='utf-8').write(feed)
print('feed.xml: %s (%s, %d photos) -> %s' % (latest['title'], latest['added'], len(shots), link))

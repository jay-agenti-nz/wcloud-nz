#!/usr/bin/env python3
"""Local preview server that mirrors the Netlify redirects.

The site links to clean URLs (/restaurants, /intake, /privacy...) which
netlify.toml rewrites to the .html files. A plain http.server knows
nothing about that, so every one of those links 404s locally and the
preview stops matching production.

This reads the redirects out of netlify.toml so the two cannot drift.

Lives in .claude/ rather than the repo root so it is never published.
"""
import http.server
import os
import re
import socketserver
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8899


def load_redirects():
    """Pull [[redirects]] from/to pairs out of netlify.toml."""
    path = os.path.join(ROOT, 'netlify.toml')
    try:
        with open(path, encoding='utf-8') as fh:
            toml = fh.read()
    except OSError:
        return {}
    pairs = re.findall(
        r'\[\[redirects\]\]\s*\n\s*from\s*=\s*"([^"]+)"\s*\n\s*to\s*=\s*"([^"]+)"',
        toml)
    return {frm.rstrip('/'): to for frm, to in pairs}


REDIRECTS = load_redirects()


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def translate_path(self, path):
        clean = path.split('?', 1)[0].split('#', 1)[0].rstrip('/')
        target = REDIRECTS.get(clean)
        if target:
            path = target
        elif clean and not os.path.splitext(clean)[1]:
            # Anything else extension-less: try <name>.html before 404ing.
            candidate = os.path.join(ROOT, clean.lstrip('/') + '.html')
            if os.path.isfile(candidate):
                path = clean + '.html'
        return super().translate_path(path)

    def end_headers(self):
        # No caching locally, so a reload always shows the current file.
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write('%s\n' % (fmt % args))


if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print('preview on http://localhost:%d  (%d redirects loaded)'
              % (PORT, len(REDIRECTS)))
        httpd.serve_forever()

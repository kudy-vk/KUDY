# Serves the repository for the design mockups at http://127.0.0.1:4400/.
#
# Like `python -m http.server`, but every answer says "do not keep a copy"
# (Cache-Control: no-store). The plain server sends no cache header, so a
# browser may keep an old kit.css or module for hours by its own guess and
# show a new page with old styles (2026-11-15: the «Пра горад» map fell apart
# that way). Run from the repository root:
#   python docs/design/production/tools/serve.py [port]
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoStore(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()


port = int(sys.argv[1]) if len(sys.argv) > 1 else 4400
server = ThreadingHTTPServer(('127.0.0.1', port), partial(NoStore, directory='.'))
print(f'Serving the repository at http://127.0.0.1:{port}/ (no-store)')
server.serve_forever()

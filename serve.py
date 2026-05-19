#!/usr/bin/env python3
"""
Static dev server with SSE-based auto-reload.
Watches all files under the project root and triggers a browser reload on any change.
"""
import os
import sys
import time
import threading
import mimetypes
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from urllib.parse import urlparse, unquote

PORT = 4002
ROOT = os.path.dirname(os.path.abspath(__file__))

RELOAD_SCRIPT = b"""
<script>
(function() {
  var es = new EventSource('/__reload');
  es.onmessage = function() { location.reload(); };
  es.onerror = function() { es.close(); setTimeout(function() { location.reload(); }, 500); };
})();
</script>
"""

_clients = []
_clients_lock = threading.Lock()


def watch_files():
    def snapshot():
        times = {}
        SKIP_DIRS = {'.git', 'node_modules'}
        for dirpath, dirnames, filenames in os.walk(ROOT):
            # Skip hidden dirs and known large non-source dirs
            parts = set(dirpath.split(os.sep))
            if parts & SKIP_DIRS or any(p.startswith('.') for p in parts):
                continue
            dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS and not d.startswith('.')]
            for fname in filenames:
                if fname.startswith('.') or fname == 'serve.py':
                    continue
                path = os.path.join(dirpath, fname)
                try:
                    times[path] = os.path.getmtime(path)
                except OSError:
                    pass
        return times

    prev = snapshot()
    while True:
        time.sleep(0.4)
        curr = snapshot()
        if curr != prev:
            changed = [os.path.relpath(p, ROOT) for p in curr if curr.get(p) != prev.get(p)]
            changed += [os.path.relpath(p, ROOT) for p in prev if p not in curr]
            for f in changed:
                print(f"  changed: {f}")
            prev = curr
            with _clients_lock:
                for q in list(_clients):
                    q.append(True)


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt, *args):
        # Only log non-reload, non-200 requests
        if self.path != '/__reload' and args[1] != '200':
            sys.stderr.write(f"{self.address_string()} - {fmt % args}\n")

    def do_GET(self):
        path = unquote(urlparse(self.path).path)

        if path == '/__reload':
            self._sse()
            return

        # Resolve to filesystem path
        if path.endswith('/'):
            path += 'index.html'
        fpath = os.path.join(ROOT, path.lstrip('/'))

        # Directory with index.html fallback
        if os.path.isdir(fpath):
            fpath = os.path.join(fpath, 'index.html')

        if not os.path.isfile(fpath):
            self.send_error(404, f"Not found: {path}")
            return

        mime, _ = mimetypes.guess_type(fpath)
        mime = mime or 'application/octet-stream'

        with open(fpath, 'rb') as f:
            content = f.read()

        # Inject reload script before </body>
        if 'html' in mime and b'</body>' in content:
            content = content.replace(b'</body>', RELOAD_SCRIPT + b'</body>', 1)

        self.send_response(200)
        self.send_header('Content-Type', mime)
        self.send_header('Content-Length', str(len(content)))
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(content)

    def _sse(self):
        self.send_response(200)
        self.send_header('Content-Type', 'text/event-stream')
        self.send_header('Cache-Control', 'no-cache')
        self.send_header('Connection', 'keep-alive')
        self.end_headers()

        q = []
        with _clients_lock:
            _clients.append(q)

        try:
            last_ping = time.time()
            while True:
                if q:
                    q.pop(0)
                    self.wfile.write(b'data: reload\n\n')
                    self.wfile.flush()
                elif time.time() - last_ping > 15:
                    self.wfile.write(b': ping\n\n')
                    self.wfile.flush()
                    last_ping = time.time()
                else:
                    time.sleep(0.1)
        except (BrokenPipeError, ConnectionResetError, OSError):
            pass
        finally:
            with _clients_lock:
                if q in _clients:
                    _clients.remove(q)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    daemon_threads = True


if __name__ == '__main__':
    threading.Thread(target=watch_files, daemon=True).start()
    server = ThreadedHTTPServer(('0.0.0.0', PORT), Handler)
    print(f"Dev server:  http://localhost:{PORT}")
    print(f"LAN access:  http://0.0.0.0:{PORT}")
    print("Auto-reload: enabled (polling every 400ms)")
    print("Stop with:   Ctrl+C\n")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopped.")

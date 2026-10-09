#!/usr/bin/env python3
"""Local dev server for the Turaco Addis site.

`python3 -m http.server` answers 501 to every POST, so the contact form can
never succeed against it. This serves the static files exactly the same way
and forwards /api/* to the Go backend, which is how production is expected to
be wired (nginx/Caddy proxying /api to the backend on the same origin).

    python3 devserver.py                      # static + proxy to :8080
    python3 devserver.py --api http://host:port
    python3 devserver.py --port 3000
"""

import argparse
import http.server
import socketserver
import sys
import urllib.error
import urllib.request

API_PREFIX = "/api/"


class Handler(http.server.SimpleHTTPRequestHandler):
    api_base = "http://localhost:8080"

    def _proxy(self, method):
        target = self.api_base.rstrip("/") + self.path
        length = int(self.headers.get("Content-Length") or 0)
        body = self.rfile.read(length) if length else None

        req = urllib.request.Request(target, data=body, method=method)
        for header in ("Content-Type", "Accept", "User-Agent"):
            if self.headers.get(header):
                req.add_header(header, self.headers[header])
        # The backend needs an allowed Origin to emit CORS headers.
        req.add_header("Origin", self.headers.get("Origin", "http://localhost:3000"))

        try:
            with urllib.request.urlopen(req, timeout=15) as upstream:
                self.send_response(upstream.status)
                for key, value in upstream.headers.items():
                    if key.lower() not in ("transfer-encoding", "connection"):
                        self.send_header(key, value)
                self.end_headers()
                self.wfile.write(upstream.read())
        except urllib.error.HTTPError as e:
            payload = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.end_headers()
            self.wfile.write(payload)
        except Exception as e:
            # Backend down: say so honestly instead of a misleading 501.
            sys.stderr.write("proxy error for %s: %s\n" % (target, e))
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(b'{"message":"API backend unreachable"}')

    def do_POST(self):
        if self.path.startswith(API_PREFIX):
            self._proxy("POST")
        else:
            self.send_error(405, "Method Not Allowed")

    def do_OPTIONS(self):
        if self.path.startswith(API_PREFIX):
            self._proxy("OPTIONS")
        else:
            self.send_error(405, "Method Not Allowed")

    def do_GET(self):
        if self.path.startswith(API_PREFIX):
            self._proxy("GET")
        else:
            super().do_GET()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=3000)
    parser.add_argument("--api", default="http://localhost:8080",
                        help="Backend base URL that /api/* is forwarded to")
    args = parser.parse_args()

    Handler.api_base = args.api
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.ThreadingTCPServer(("", args.port), Handler) as httpd:
        print("Serving http://localhost:%d  (/api/* -> %s)" % (args.port, args.api))
        httpd.serve_forever()


if __name__ == "__main__":
    main()

import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.error import URLError, HTTPError
from urllib.request import Request, urlopen

TARGET_URL = os.environ.get(
    "RSS_TARGET_URL",
    "https://rss-hub-mu-murex.vercel.app/pixiv/user/5229572",
)
PORT = int(os.environ.get("RSS_PROXY_PORT", "8787"))


class ProxyHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path not in ("/", "/rss"):
            self.send_error(404, "Not Found")
            return

        if not TARGET_URL or TARGET_URL.startswith("<"):
            body = (
                "请先设置 RSS_TARGET_URL，例如：\n"
                'set RSS_TARGET_URL=http://127.0.0.1:1200/pixiv/user/illustfollows?key=<你的key>\n'
            ).encode("utf-8")
            self.send_response(400)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(body)
            return

        try:
            req = Request(TARGET_URL, headers={"User-Agent": "rss-proxy/1.0"})
            with urlopen(req, timeout=15) as resp:
                body = resp.read()
                status = resp.status
                content_type = resp.headers.get("Content-Type", "application/xml")
        except HTTPError as err:
            status = err.code
            body = err.read()
            content_type = err.headers.get("Content-Type", "text/plain")
        except URLError as err:
            status = 502
            body = f"Upstream error: {err}".encode("utf-8")
            content_type = "text/plain; charset=utf-8"

        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), ProxyHandler)
    print(f"RSS proxy running on http://127.0.0.1:{PORT}/rss")
    print(f"Target: {TARGET_URL}")
    server.serve_forever()

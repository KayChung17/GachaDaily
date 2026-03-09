import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer


PORT = int(os.environ.get("SYNC_PORT", "8788"))
DATA_PATH = os.environ.get("SYNC_DATA_PATH", "sync_data.json")
TOKEN = os.environ.get("SYNC_TOKEN", "demo-token")
ALLOW_ORIGIN = os.environ.get("SYNC_ALLOW_ORIGIN", "http://localhost:3000")


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def load_data():
    if not os.path.exists(DATA_PATH):
        return None
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def save_data(data):
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


class SyncHandler(BaseHTTPRequestHandler):
    def _send(self, status, body, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Access-Control-Allow-Origin", ALLOW_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()
        if body is not None:
            self.wfile.write(body)

    def _auth(self):
        auth = self.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        return token == TOKEN

    def do_OPTIONS(self):
        self._send(204, b"")

    def do_GET(self):
        if self.path != "/api/sync":
            self._send(404, b'{"error":"not found"}')
            return
        if not self._auth():
            self._send(401, b'{"error":"unauthorized"}')
            return
        data = load_data() or {"version": 0, "updatedAt": None, "payload": None}
        self._send(200, json.dumps(data).encode("utf-8"))

    def do_PUT(self):
        if self.path != "/api/sync":
            self._send(404, b'{"error":"not found"}')
            return
        if not self._auth():
            self._send(401, b'{"error":"unauthorized"}')
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length)
        try:
            incoming = json.loads(raw.decode("utf-8"))
        except json.JSONDecodeError:
            self._send(400, b'{"error":"invalid json"}')
            return

        if not incoming or "payload" not in incoming:
            self._send(400, b'{"error":"invalid payload"}')
            return

        existing = load_data()
        incoming_time = incoming.get("updatedAt")
        if existing and existing.get("updatedAt") and incoming_time:
            try:
                if datetime.fromisoformat(incoming_time) < datetime.fromisoformat(
                    existing["updatedAt"]
                ):
                    self._send(409, b'{"error":"older than server copy"}')
                    return
            except ValueError:
                pass

        saved = {
            "version": (existing.get("version", 0) + 1) if existing else 1,
            "updatedAt": now_iso(),
            "payload": incoming["payload"],
        }
        save_data(saved)
        self._send(200, json.dumps(saved).encode("utf-8"))

    def log_message(self, format, *args):
        return


if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), SyncHandler)
    print(f"Sync server: http://127.0.0.1:{PORT}/api/sync")
    print(f"Data file: {os.path.abspath(DATA_PATH)}")
    server.serve_forever()

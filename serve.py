import http.server
import socket
import socketserver
import os

PORT = 8082

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # doesn't even have to be reachable
        s.connect(('10.255.255.255', 1))
        IP = s.getsockname()[0]
    except Exception:
        IP = '127.0.0.1'
    finally:
        s.close()
    return IP

class MyHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        super().end_headers()

Handler = MyHandler

with socketserver.TCPServer(("", PORT), Handler) as httpd:
    local_ip = get_local_ip()
    print(f"\n\033[96m Vaatia College Dev Server Started\033[0m")
    print(f"\033[92m   Local:   http://localhost:{PORT}\033[0m")
    if local_ip != '127.0.0.1':
        print(f"\033[92m   Network: http://{local_ip}:{PORT}\033[0m")
    print(f"\n\033[90m   Press Ctrl+C to stop\033[0m")
    httpd.serve_forever()

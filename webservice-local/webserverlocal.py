# Based on:
# https://pythonbasics.org/webserver/

from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import subprocess
import sys

PARAMETER_HOSTNAME = "localhost"
PARAMETER_PORT = 4567
# Set by the installer: the network interface the VPN creates (see: ip -brief link)
PARAMETER_VPN_INTERFACE = "placeholder"

def get_vpn_status():
    try:
        with open(f"/sys/class/net/{PARAMETER_VPN_INTERFACE}/flags") as f:
            flags = int(f.read().strip(), 16)
    except FileNotFoundError:
        return "DOWN"
    except (OSError, ValueError) as e:
        print(f"Could not read interface state: {e}", file=sys.stderr)
        return "ERROR"
    return "UP" if flags & 0x1 else "DOWN"
        
class MyServer(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        # Always avoid storing connection information
        pass
    def do_GET(self):
        if self.path == "/getvpnstatus":
            self.send_response(200)
            self.send_header("Content-type", "text/plain; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", 0)
            self.end_headers()
            status = get_vpn_status()
            self.wfile.write(bytes("status=" + status, "utf-8"))

        else:

            self.send_response(200)
            self.send_header("Content-type", "text/plain; charset=utf-8")
            self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
            self.send_header("Pragma", "no-cache")
            self.send_header("Expires", 0)
            self.end_headers()
            self.wfile.write(bytes("YOUR LOCAL WEB SERVER IS UP", "utf-8"))
            #self.send_response(503)
            #self.end_headers()
        #print("Request served", flush=True)

if __name__ == "__main__":        
    webServer = HTTPServer((PARAMETER_HOSTNAME, PARAMETER_PORT), MyServer)
    print("Server started http://%s:%s" % (PARAMETER_HOSTNAME, PARAMETER_PORT), flush=True)

    try:
        webServer.serve_forever()
    except KeyboardInterrupt:
        print(f"KeyboardInterrupt caught")
        pass

    webServer.server_close()
    print("Server stopped", flush=True)

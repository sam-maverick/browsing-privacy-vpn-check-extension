# Based on:
# https://pythonbasics.org/webserver/

from http.server import BaseHTTPRequestHandler, HTTPServer
import time
import subprocess

PARAMETER_HOSTNAME = "localhost"
PARAMETER_PORT = 4567
# If you don't know your identifier, bring the VPN up and run the command:
# nmcli connection show --active | awk '{print substr($0,0,22)}'
PARAMETER_VPN_IDENTIFIER = "placeholder"


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

            status = ""
            try:
                result = subprocess.check_output("nmcli --terse --fields NAME connection show --active | grep '"+PARAMETER_VPN_IDENTIFIER+"'", shell=True)
                if PARAMETER_VPN_IDENTIFIER in result.decode("utf-8"):
                    status = "UP"
                else:
                    status = "UNKNOWN"
            except subprocess.CalledProcessError as e:
                status = "DOWN"
            
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
        pass

    webServer.server_close()
    print("Server stopped", flush=True)

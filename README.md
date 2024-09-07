
## What is this?

This is a Firefox extension that allows you to block connections to specific domains (and subdomains) when your anonymity VPN is down. It may be useful if you don't wan't to use the kill switch but still want to have privacy when browsing certain sites. Note that there is a remote possibility that your VPN drops between the time the VPN status is checked and the time the connection is allowed, in which case the connection would not be protected. 

This software is based on https://github.com/mdn/webextensions-examples/tree/main/proxy-blocker and https://pythonbasics.org/webserver/.

See the LICENSE files for licensing information.

## System requirements

- Linux (e.g., **Ubuntu**).
  If you are on Windows or Mac, you can still make it work but you'll need to adapt things by yourself.
- **Sudo** privileges.
- A browser that supports the WebExtensions API (e.g., **Firefox**).
- **Node** installed. Check [this](https://nodejs.org/en/download/prebuilt-installer) for more info.
- **Python3** installed. Check [this](https://www.python.org/downloads/) for more info.

## A few boring technical details...

It uses the proxy API listener `onRequest` to listen for requests to visit a web page, compare the webpage's domain with a host list, and proxy domains on the list to 127.0.0.1 when the VPN is down. The list of domains is held in local storage and given the initial value `["example.com", "example.org"]` when the extension installs. The list can be modified through the extension's options page. Since there is not much support for shell command execution from browser extensions, the extension gets the VPN status information from a local web server written in Python.

## Installation

* Download this repo in some folder of your computer.
* Open a terminal, go to your repo, and `cd webserver-local`. Then run `node ./installer.linux.js` and follow the on-screen instructions.
* Check that your local web server is running by visiting http://localhost:4567/getvpnstatus. You should get either `status=UP` or `status=DOWN`.
* Install the `site-blocker-when-vpn-down` extension in Firefox, if you have not yet done so.
* Visit `about:addons`, open this add-on's Preferences, and replace the default values by the list of domains you want to protect. One per line. Do not use wildcard, since all subdomains will automatically be protected.
* **Important:** On the Preferences tab, set "Run in Private Windows" to "Allow".

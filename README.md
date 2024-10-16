
## What is this?

This is a browser extension that allows you to block connections to specific domains (and subdomains) when your anonymity VPN is down. It may be useful if you don't wan't to use the kill switch but still want to have privacy when browsing certain sites. It helps prevent leaking information to your ISP or internet provider when you forgot to activate the VPN and you browse a sensitive site. Note that there is a remote possibility that your VPN drops between the time the VPN status is checked and the time the connection is allowed, in which case the connection would not be protected. 

This software is inspired on https://github.com/mdn/webextensions-examples/tree/main/proxy-blocker and https://pythonbasics.org/webserver/.

This add-on does not collect any personal information.

See the LICENSE files for licensing information.

## System requirements

The main requirement is:

- A browser that supports the WebExtensions API (e.g., Firefox).

If you want to use the more reliable "local service" mode of operation instead of the default "check externally", then there are these additional requirements:

- You run the browser on a **Linux** system.
  If you are on Windows or Mac, you can still make it work but you'll need to adapt things by yourself.
- **Sudo** privileges.
- **Node** installed. Check [this](https://nodejs.org/en/download/prebuilt-installer) for more info.
- **Python3** installed. Check [this](https://www.python.org/downloads/) for more info.

## Configuration options

- Domains to block when VPN is down:
  Enter one domain per line. Do not use wildcards, since sub-domains and sub-sub-domains are always included. Whenever you load a web page on one of those domains, it will be blocked if the VPN is down. Do not add the `ip.me` domain nor the `me` domain to the list.
- Block when in non-incognito mode:
  Connections to the protected domains made in non-incognito mode are also blocked if this option is activated. In those cases, the associated entry in the browsing history is also deleted for privacy. This is useful in case you forgot to visit the site in incognito mode.
- Mode of operation:
  When "user local service" is selected, the add-on will connect to a local service on your computer to check the VPN status. Note that this the most reliable and robust mode, but it requires a bit of installation work. See Installation, below.
  When "check externally" is selected, then you need to configure the country code name of where your actual internet connection is. This mode will check your IP location whenever you browse a site from the list of the domains to block. This IP location is obtained every time by connection to using https://ip.me. If your IP location corresponds to the country code entered in the text box, this will be interpreted as that your VPN is down. Note that the use of this add-on with the "check externally" mode of operation may expose evidence about the fact that you are using this add-on.
- Debug:
  When activated, debugging information will be thrown to the console. When deactivated, no logs are generated at all.

## Installation

* Install the `site-blocker-when-vpn-down` extension in Firefox (you can download it from [here](https://addons.mozilla.org/en-US/firefox/addon/site-blocker-when-vpn-down/)), if you have not yet done so.
* Visit `about:addons`, open this add-on's Preferences, and configure the options as appropriate.
* **Important:** On the Preferences tab, set "Run in Private Windows" to "Allow".

If you want to use the "use local service" mode of operation, you will need to perform these additional steps:

* Download this repo in some folder of your computer.
* Open a terminal, go to your repo, and `cd webservice-local`. Then run `node ./installer.linux.js` and follow the on-screen instructions.
* Check that your local web server is running by visiting http://localhost:4567/getvpnstatus. You should get either `status=UP` or `status=DOWN`.

## A few boring technical details...

It uses the proxy API listener `onRequest` to listen for requests to visit a web page, compare the webpage's domain with a host list, and proxy domains on the list to 127.0.0.1 when the VPN is down. The list of domains is held in local storage and given the initial value `['example.com', 'example.org']` when the extension installs. The list can be modified through the extension's options page. Since there is not much support for shell command execution from browser extensions, the extension gets the VPN status information from a local web server written in Python.

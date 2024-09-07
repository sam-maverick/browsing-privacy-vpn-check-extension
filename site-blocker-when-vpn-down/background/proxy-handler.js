// Initialize the list of blocked hosts
let blockedHosts = ["example.com", "example.org"];

const host = 'localhost';
const port = '4567';


// Set the default list on installation.
browser.runtime.onInstalled.addListener(details => {
  browser.storage.local.set({
    blockedHosts: blockedHosts
  });
});

// Get the stored list
browser.storage.local.get(data => {
  if (data.blockedHosts) {
    blockedHosts = data.blockedHosts;
  }
});

// Listen for changes in the blocked list
browser.storage.onChanged.addListener(changeData => {
  blockedHosts = changeData.blockedHosts.newValue;
});


// Listen for a request to open a webpage
browser.proxy.onRequest.addListener(handleProxyRequest, {urls: ["<all_urls>"]});


// On the request to open a webpage
async function handleProxyRequest(requestInfo) {
// Read the web address of the page to be visited 
  const url = new URL(requestInfo.url);
  for (let i = 0; i <= blockedHosts.length; i++) {
    let pattern = new RegExp("^(.*)" + blockedHosts[i] + "$");
    // Determine whether the domain in the web address is on the blocked hosts list
    if (pattern.test(url.hostname)) {
      try {
        let http;
        var data;
        http = new XMLHttpRequest();
        http.open('GET', 'http://' + host + ':' + port + '/getvpnstatus', false);
        http.send();
        data = http.responseText;
        //console.log("Received from server: " + data);
  
        if (data.includes('status=UP')) {
          // Continue connection
          return {type: "direct"};
        } else {
          // Proxy to a cul-de-sac
          return {type: "http", host: "127.0.0.1", port: 65535};
        }  
      } catch (err) {
        console.error(`An exception occurred: ${err.message}`);
        console.error(`Check that your local web server is up by connecting to http://${host}:${port}`);
        return {type: "http", host: "127.0.0.1", port: 65535};
      }

    }  
  }

  // Return instructions to open the requested webpage when the site is not in the list
  return {type: "direct"};
}

// Log any errors from the proxy script
browser.proxy.onError.addListener(error => {
  console.error(`Proxy handling error: ${error.message}`);
});




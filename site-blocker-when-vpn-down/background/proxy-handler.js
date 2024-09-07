// Initialize the list of blocked hosts
let blockedHosts = ["example.com", "example.org"];
let forceIncognito = true;

const host = 'localhost';
const port = '4567';


// Set the default list on installation.
browser.runtime.onInstalled.addListener(details => {
  browser.storage.local.set({
    blockedHosts: blockedHosts,
    forceIncognito: forceIncognito,
  });
});

// Get the stored list
browser.storage.local.get(data => {
  if (data.blockedHosts) {
    blockedHosts = data.blockedHosts;
  }
  if (data.forceIncognito !== undefined) {
    forceIncognito = data.forceIncognito;
  }
});

// Listen for changes in the blocked list
browser.storage.onChanged.addListener(changeData => {
  blockedHosts = changeData.blockedHosts.newValue;
  forceIncognito = changeData.forceIncognito.newValue;
});


// Listen for a request to open a webpage
browser.proxy.onRequest.addListener(handleProxyRequest, {urls: ["<all_urls>"]});


/*
function onRemoved(removeInfo) {
  if (removeInfo.urls.length) {
    console.log(`Removed: ${removeInfo.urls[0]}`);
  }
}
browser.history.onVisitRemoved.addListener(onRemoved);
*/

async function DeleteLastEntryHistory(textsearch) {
  let results = await browser.history.search({
    text: textsearch,
    startTime: 0,
    maxResults: 1,
  });
  
  if (results.length) {
    console.log(`Removing: ${results[0].url}`);
    browser.history.deleteUrl({ url: results[0].url });
  }  
}



// On the request to open a webpage
async function handleProxyRequest(requestInfo) {
// Read the web address of the page to be visited 
  const url = new URL(requestInfo.url);
  //console.log("Connection request for: "+requestInfo.url);
  for (let i = 0; i < blockedHosts.length; i++) {
    const hostentry = String(blockedHosts[i]).toLocaleLowerCase().trim();
    //console.log("Checking: "+hostentry);
    const hostconnecting = String(url.hostname).toLocaleLowerCase().trim();
    let pattern = new RegExp("^(.*)" + hostentry + "$");
    // Determine whether the domain in the web address is on the blocked hosts list
    if (pattern.test(hostconnecting) || (hostconnecting == hostentry)) {
      // Domain matched !
      try {
        
        if (forceIncognito) {
          // Check incognito mode
          if ( ! requestInfo.incognito) {
            // Prevent from adding to browsing history
            await DeleteLastEntryHistory(hostconnecting);
            // Proxy to a cul-de-sac
            return {type: "http", host: "127.0.0.1", port: 65535};
          }
        }

        // Check that VPN is up
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




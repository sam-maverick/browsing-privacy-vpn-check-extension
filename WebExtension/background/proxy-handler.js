// Initialize the list of blocked hosts
let blockedHosts = ['example.com', 'example.org'];
let countryCode = 'US';
let forceIncognito = true;
let modeOfOperation = 'externalcheck';
let debugging = false;

const host = 'localhost';
const port = '4567';


// Set the default list on installation.
browser.runtime.onInstalled.addListener(details => {
  browser.storage.local.set({
    blockedHosts: blockedHosts,
    forceIncognito: forceIncognito,
    modeOfOperation: modeOfOperation,
    debugging: debugging,
    countryCode: countryCode,
  });
});

// Get the stored list
browser.storage.local.get(data => {
  if (data.blockedHosts) {
    blockedHosts = data.blockedHosts;
  }
  if (data.countryCode) {
    countryCode = data.countryCode;
  }
  if (data.forceIncognito !== undefined) {
    forceIncognito = data.forceIncognito;
  }
  if (data.modeOfOperation !== undefined) {
    modeOfOperation = data.modeOfOperation;
  }
  if (data.debugging !== undefined) {
    debugging = data.debugging;
  }
});

// Listen for changes in the blocked list
browser.storage.onChanged.addListener(changeData => {
  blockedHosts = changeData.blockedHosts.newValue;
  countryCode = changeData.countryCode.newValue;
  forceIncognito = changeData.forceIncognito.newValue;
  modeOfOperation = changeData.modeOfOperation.newValue;
  debugging = changeData.debugging.newValue;
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
  const hostconnecting = String(url.hostname).toLocaleLowerCase().trim();
  if (debugging)  console.log("Connection request for: "+requestInfo.url);

  if (hostconnecting=='ip.me') {
    if (debugging)  console.log('Skipping protections in requests to ip.me');
    return {type: "direct"};
  }

  for (let i = 0; i < blockedHosts.length; i++) {
    const hostentry = String(blockedHosts[i]).toLocaleLowerCase().trim();
    if (debugging)  console.log("Checking: "+hostentry);
    let pattern = new RegExp("^(.*)" + hostentry + "$");
    // Determine whether the domain in the web address is on the blocked hosts list
    if (pattern.test(hostconnecting) || (hostconnecting == hostentry)) {
      // Domain matched !
      if (debugging)  console.log('Domain matched!');
        
      if (forceIncognito) {
        // Check incognito mode
        if ( ! requestInfo.incognito) {
          // Prevent from adding to browsing history
          await DeleteLastEntryHistory(hostconnecting);
          // Proxy to a cul-de-sac
          if (debugging)  console.log('Browsing history entry cleared. Denying connection because not in incognito mode');
          return {type: "http", host: "127.0.0.1", port: 65535};
        }
      }

      // Check that VPN is up
      if (modeOfOperation == 'localservice') {
        try {
          let http;
          var data;
          http = new XMLHttpRequest();
          http.open('GET', 'http://' + host + ':' + port + '/getvpnstatus', false);
          http.send();
          data = http.responseText;
          if (debugging)  console.log("Received from server: " + data);
    
          if (data.includes('status=UP')) {
            // Continue connection
            return {type: "direct"};
          } else {
            // Proxy to a cul-de-sac
            if (debugging)  console.log('Denying connection because the local service signals that the VPN is down');
            return {type: "http", host: "127.0.0.1", port: 65535};
          }  
        } catch (err) {
          if (debugging)  console.error(`An exception occurred: ${err.message}`);
          if (debugging)  console.error(`Check that your local web server is up by connecting to http://${host}:${port}`);
          return {type: "http", host: "127.0.0.1", port: 65535};
        }
      } else if (modeOfOperation == 'externalcheck') {
        // ToDo
        let http;
        var data;
        http = new XMLHttpRequest();
        http.open('GET', 'https://ip.me/', false);
        http.send();
        data = http.responseText;
        //console.log("Received from server: " + data);

        let datatrimmed = data.replace(/ /g, '').replace(/\n/g, '').replace(/\r/g, '');

        if (datatrimmed.includes('<tr><th>CountryCode:</th><td><code>' + countryCode.toLocaleUpperCase() + '</code></td></tr>')) {
          // Connecting from the same country. Proxy to a cul-de-sac
          if (debugging)  console.log('Denying connection because external check tells that we are in the same country');
          return {type: "http", host: "127.0.0.1", port: 65535};
        } else if (datatrimmed.includes('<tr><th>CountryCode:</th><td><code>')) {
          // We received a valid check. Continue connection
          return {type: "direct"};
        }  else {
          // Invalid data received from server. Proxy to a cul-de-sac
          if (debugging)  console.log('Denying connection because external check gave an unexpected reply');
          return {type: "http", host: "127.0.0.1", port: 65535};
        }

      } else {
        if (debugging)  console.error(`An exception occurred: ${err.message}`);
        if (debugging)  console.error(`Invalid configuration; modeOfOperation must be either localservice or externalcheck.`);
        return {type: "http", host: "127.0.0.1", port: 65535};
      }

    }  
  }

  // Return instructions to open the requested webpage when the site is not in the list
  return {type: "direct"};
}

// Log any errors from the proxy script
browser.proxy.onError.addListener(error => {
  if (debugging)  console.error(`Proxy handling error: ${error.message}`);
});




const blockedHostsTextArea = document.querySelector("#blocked-hosts");
const countryCodeTextArea = document.querySelector("#country-code");
const forceIncognitoCheckbox = document.querySelector("#force-incognito");
const modeOfOperationRadioboxLocalservice = document.querySelector("#localservice");
const modeOfOperationRadioboxExternalcheck = document.querySelector("#externalcheck");
const debuggingRadioboxOn = document.querySelector("#on");
const debuggingRadioboxOff = document.querySelector("#off");

// Store the currently selected settings using browser.storage.local.
function storeSettings() {
  let blockedHosts = blockedHostsTextArea.value.split("\n");
  let countryCode = countryCodeTextArea.value;
  let forceIncognito = forceIncognitoCheckbox.checked;
  let modeOfOperation = modeOfOperationRadioboxLocalservice.checked ? 'localservice' : 'externalcheck';
  let debugging = debuggingRadioboxOn.checked ? true : false;
  browser.storage.local.set({
    blockedHosts,
    countryCode,
    forceIncognito,
    modeOfOperation,
    debugging,
  });
}

// Update the options UI with the settings values retrieved from storage,
// or the default settings if the stored settings are empty.
function updateUI(restoredSettings) {
  blockedHostsTextArea.value = restoredSettings.blockedHosts.join("\n");
  countryCodeTextArea.value = restoredSettings.countryCode;
  forceIncognitoCheckbox.checked = restoredSettings.forceIncognito;
  if (restoredSettings.modeOfOperation === 'localservice') {
    modeOfOperationRadioboxLocalservice.checked = true;
  }
  if (restoredSettings.modeOfOperation === 'externalcheck') {
    modeOfOperationRadioboxExternalcheck.checked = true;
  }
  if (restoredSettings.debugging === true) {
    debuggingRadioboxOn.checked = true;
  }
  if (restoredSettings.debugging === false) {
    debuggingRadioboxOff.checked = true;
  }
}

function onError(e) {
  console.error(e);
}

// On opening the options page, fetch stored settings and update the UI with them.
browser.storage.local.get().then(updateUI, onError);

// Whenever the contents of the textarea changes, save the new values
blockedHostsTextArea.addEventListener("change", storeSettings);
countryCodeTextArea.addEventListener("change", storeSettings);
forceIncognitoCheckbox.addEventListener("change", storeSettings);
modeOfOperationRadioboxLocalservice.addEventListener("change", storeSettings);
modeOfOperationRadioboxExternalcheck.addEventListener("change", storeSettings);
debuggingRadioboxOn.addEventListener("change", storeSettings);
debuggingRadioboxOff.addEventListener("change", storeSettings);
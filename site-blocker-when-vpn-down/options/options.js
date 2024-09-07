const blockedHostsTextArea = document.querySelector("#blocked-hosts");
const forceIncognitoCheckbox = document.querySelector("#force-incognito");

// Store the currently selected settings using browser.storage.local.
function storeSettings() {
  let blockedHosts = blockedHostsTextArea.value.split("\n");
  let forceIncognito = forceIncognitoCheckbox.checked;
  browser.storage.local.set({
    blockedHosts,
    forceIncognito,
  });
}

// Update the options UI with the settings values retrieved from storage,
// or the default settings if the stored settings are empty.
function updateUI(restoredSettings) {
  blockedHostsTextArea.value = restoredSettings.blockedHosts.join("\n");
  forceIncognitoCheckbox.checked = restoredSettings.forceIncognito;
}

function onError(e) {
  console.error(e);
}

// On opening the options page, fetch stored settings and update the UI with them.
browser.storage.local.get().then(updateUI, onError);

// Whenever the contents of the textarea changes, save the new values
blockedHostsTextArea.addEventListener("change", storeSettings);
forceIncognitoCheckbox.addEventListener("change", storeSettings);

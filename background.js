console.log("background here");

chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    // read changeInfo data and do something with it
    // like send the new url to contentscripts.js
    if (changeInfo.url && changeInfo.url.match(/youtube.com\/watch\?/)) {
      chrome.scripting.executeScript(
        {
          target: { tabId: tabId },
          files: ['js/content.js'],
        },
        () => {
          console.log("injected");
        });
    }
  }
);
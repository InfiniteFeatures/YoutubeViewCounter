console.log("background here");

chrome.tabs.onUpdated.addListener(
  function (tabId, changeInfo, tab) {
    console.log("maybe sending message", changeInfo);
    if (changeInfo.url && changeInfo.url.match(/youtube.com\/watch\?/)) {
      console.log("sending message");
      chrome.tabs.sendMessage(tabId, {
        message: 'video',
        url: changeInfo.url
      })
    }
  }
);
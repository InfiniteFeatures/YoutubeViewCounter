document.querySelector("#clear").addEventListener("click", async () => {
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    chrome.tabs.sendMessage(tab.id, {
        message: 'clear'
    })
});
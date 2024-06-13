console.log('background is running')

chrome.runtime.onMessage.addListener((request) => {
  if (request.type === 'COUNT') {
    console.log('background has received a message from popup, and count is ', request?.count)
  }
})

chrome.contextMenus.create({
  id: "showPageTitle",
  title: "SiteStash",
  contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "showPageTitle") {
    chrome.tabs.sendMessage(tab.id, { action: "getPageTitle" });
  }
});
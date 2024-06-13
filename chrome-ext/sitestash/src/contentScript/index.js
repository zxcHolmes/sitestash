console.info('contentScript is running')
import { createApp } from 'vue'
import App from './Content.vue'
const siteStash = document.createElement('div');
siteStash.style.backgroundColor = 'red';
siteStash.style.width = '100px';
siteStash.style.height = '100px';
siteStash.style.position = 'fixed';
siteStash.style.top = '50%';
siteStash.style.right = '0';
siteStash.style.transform = 'translate(0, -50%)';
siteStash.id="sitestash"
document.body.appendChild(siteStash);
createApp(App).mount('#sitestash')
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "getPageTitle") {
    alert(document.title);
  }
});
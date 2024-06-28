console.info('contentScript is running')
import {createApp} from 'vue'
import App from './Content.vue'

const siteStash = document.createElement('div');
siteStash.id = "sitestash"
document.body.appendChild(siteStash);
const siteStashIns = createApp(App).mount('#sitestash')


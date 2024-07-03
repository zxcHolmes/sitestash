import * as storage from "../storage.js"
import {Ollama} from 'ollama/browser'

console.log('background is running')

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
  } else if (request.action === "generateContent") {
    let promptId = request.promptId
    let article = request.article
    let gptSettings = await storage.readGPTSetting()
    let promptTemplates = await storage.readTemplate()
    const index = promptTemplates.findIndex(item => item.id === promptId);
    if (!gptSettings.ollamaApi) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "message",
        message: "Please configure the ollama api address"
      });
      return
    }
    if (!gptSettings.ollamaModelName) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "message",
        message: "Please configure the ollama model Name"
      });
      return
    }
    if (!gptSettings.numCtx) {
      gptSettings.numCtx = 4096
    }
    if (index !== -1) {
      let promptTemplate = promptTemplates[index]
      let promptContent = promptTemplate.content
      const ollama = new Ollama({host: gptSettings.ollamaApi})
      const response = await ollama.generate({
        model: gptSettings.ollamaModelName,
        prompt: promptContent.replace("{article}", article),
        stream: true,
        options: {
          num_ctx: parseInt(gptSettings.numCtx)
        }
      })
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "gptOutputStart",
        message: ""
      });
      for await (const part of response) {
        console.log(part.response)
        chrome.tabs.sendMessage(sender.tab.id, {
          action: "gptOutput",
          message: part.response
        });
      }
    } else {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "message",
        message: "Cannot find the prompt " + promptId
      });
    }

  }
});

chrome.contextMenus.create({
  id: "SiteStash",
  title: "SiteStash",
  contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "SiteStash") {
    if (info.selectionText){
      chrome.tabs.sendMessage(tab.id, {action: "SelectText", "text": info.selectionText});
    }else {
      chrome.tabs.sendMessage(tab.id, {action: "SiteStash"});
    }

  }
});

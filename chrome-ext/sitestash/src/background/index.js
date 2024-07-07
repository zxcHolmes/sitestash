import * as storage from "../storage.js"
import {Ollama} from 'ollama/browser'

console.log('background is running')

const checkGPTSettings = async () => {
  let gptSettings = await storage.readGPTSetting()
  if (!gptSettings.ollamaApi) {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Please configure the ollama api address"
    });
    return null
  }
  if (!gptSettings.ollamaModelName) {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Please configure the ollama model Name"
    });
    return null
  }
  if (!gptSettings.numCtx) {
    gptSettings.numCtx = 4096
  }
  return gptSettings
}

const checkPromptTemplates = async (promptId) => {
  let promptTemplates = await storage.readTemplate()
  const promptTemplate = promptTemplates.find(
    item => item.id === promptId);
  if (!promptTemplate) {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Cannot find the prompt " + promptId
    });
    return null
  } else {
    return promptTemplate
  }
}

const generateContent = async (request, sender) => {
  let promptId = request.promptId
  let article = request.article
  let gptSettings = await checkGPTSettings()
  if (!gptSettings) {
    return
  }
  let promptTemplate = await checkPromptTemplates(promptId)
  if (promptTemplate !== null) {
    let promptContent = promptTemplate.content
    const ollama = new Ollama({host: gptSettings.ollamaApi})
    let response;
    try {
      response = await ollama.generate({
        model: gptSettings.ollamaModelName,
        prompt: promptContent.replace("{article}", article),
        stream: true,
        options: {
          num_ctx: parseInt(gptSettings.numCtx)
        }
      })
    } catch (e) {
      chrome.tabs.sendMessage(sender.tab.id, {
        action: "message",
        message: "Got an error when generating content: " + e.message
      });
      return
    }

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
  }
}

const generateTags = async (request, sender) => {
  let article = request.article
  let gptSettings = await checkGPTSettings()
  if (!gptSettings) {
    return
  }
  const ollama = new Ollama({host: gptSettings.ollamaApi})
  const promptContent = `从下面文章提取5个关键词，关键词用来给文章分类，要求符合人类的分类习惯，关键词使用逗号分隔输出。
{article}`
  let response;
  try {
    response = await ollama.generate({
      model: gptSettings.ollamaModelName,
      prompt: promptContent.replace("{article}", article),
      stream: false,
      options: {
        num_ctx: parseInt(gptSettings.numCtx)
      }
    })
  } catch (e) {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Got an error when generating tags: " + e.message
    });
    return
  }
  chrome.tabs.sendMessage(sender.tab.id, {
    action: "generateTagsResponse",
    message: response.response
  })
}

const generateTitle = async (request, sender) => {
  let article = request.article
  let gptSettings = await checkGPTSettings()
  if (!gptSettings) {
    return
  }
  const ollama = new Ollama({host: gptSettings.ollamaApi})
  const promptContent = `给下面文章起一个合适的标题,直接输出标题，不要给选项。
{article}`
  let response;
  try {
    response = await ollama.generate({
      model: gptSettings.ollamaModelName,
      prompt: promptContent.replace("{article}", article),
      stream: false,
      options: {
        num_ctx: parseInt(gptSettings.numCtx)
      }
    })
  } catch (e) {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Got an error when generating title: " + e.message
    });
    return
  }
  chrome.tabs.sendMessage(sender.tab.id, {
    action: "generateTitleResponse",
    message: response.response
  })
}



const saveGptOutput = async (request, sender) => {
  const otherSettings = await storage.readOtherSettings()
  const url = otherSettings.receiveApi
  const data = {
    url: request.url,
    gpt_output: request.gpt_output,
    tags: request.tags,
    title: request.title
  }

  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(result => {
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Successfully send data to url " + url,
      type: "success"
    });
  })
  .catch(error => {
    console.error(error)
    chrome.tabs.sendMessage(sender.tab.id, {
      action: "message",
      message: "Got an error when send data to url " + url + error.message
    });
  });
}

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (request.action === "openOptionsPage") {
    chrome.runtime.openOptionsPage();
  } else if (request.action === "generateContent") {
    await generateContent(request, sender)
  } else if (request.action === "generateTags") {
    await generateTags(request, sender)
  } else if (request.action === "saveGptOutput") {
    await saveGptOutput(request, sender)
  } else if (request.action === "generateTitle") {
    await generateTitle(request, sender)
  }
});

chrome.contextMenus.create({
  id: "SiteStash",
  title: "SiteStash",
  contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener(function (info, tab) {
  if (info.menuItemId === "SiteStash") {
    if (info.selectionText) {
      chrome.tabs.sendMessage(tab.id,
        {action: "SelectText", "text": info.selectionText});
    } else {
      chrome.tabs.sendMessage(tab.id, {action: "SiteStash"});
    }

  }
});

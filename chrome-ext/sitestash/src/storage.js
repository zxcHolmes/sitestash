export const KEY_PROMPT_TEMPLATES = "promptTemplates"
export const KEY_GPT_SETTINGS = "gptSettings"

export const KEY_OTHER_SETTINGS = "otherSettings"
export const saveTemplate = (promptTemplates) => {
  chrome.storage.sync.set(
      {[KEY_PROMPT_TEMPLATES]: JSON.stringify(promptTemplates)})
}
/**
 * Reads templates from chrome storage.
 * @returns {Promise<any[]>} A promise that resolves to an array of any type.
 */
export const readTemplate = async () => {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get([KEY_PROMPT_TEMPLATES], (result) => {
        const templates = JSON.parse(result[KEY_PROMPT_TEMPLATES] ?? '[]');
        resolve(templates);
      });
    });
  } catch (error) {
    console.error('Error reading templates:', error);
    return []
  }
};

export const saveGPTSetting = async (gptSettings) => {
  chrome.storage.sync.set(
      {[KEY_GPT_SETTINGS]: JSON.stringify(gptSettings)})
};

export const readGPTSetting = async () => {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get([KEY_GPT_SETTINGS], (result) => {
        const gptSettings = JSON.parse(result[KEY_GPT_SETTINGS] ?? '{}');
        resolve(gptSettings);
      });
    });
  } catch (error) {
    console.error('Error reading gptSettings:', error);
    return {}
  }
};

export const saveOtherSettings = async (otherSettings) => {
  chrome.storage.sync.set(
    {[KEY_OTHER_SETTINGS]: JSON.stringify(otherSettings)})
};

export const readOtherSettings = async () => {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get([KEY_OTHER_SETTINGS], (result) => {
        const otherSettings = JSON.parse(result[KEY_OTHER_SETTINGS] ?? '{}');
        resolve(otherSettings);
      });
    });
  } catch (error) {
    console.error('Error reading otherSettings:', error);
    return {}
  }
};

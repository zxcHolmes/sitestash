export const KEY_PROMPT_TEMPLATES = "promptTemplates"
export const saveTemplate = (promptTemplates) => {
  console.log("save", promptTemplates)
  chrome.storage.sync.set(
      {[KEY_PROMPT_TEMPLATES]: JSON.stringify(promptTemplates)}, (result) => {
        console.log("saveResult", result)
      })
}
/**
 * Reads templates from chrome storage.
 * @returns {Promise<any[]>} A promise that resolves to an array of any type.
 */
export const readTemplate = async () => {
  try {
    return new Promise((resolve) => {
      chrome.storage.sync.get([KEY_PROMPT_TEMPLATES], (result) => {
        console.log(result, result[KEY_PROMPT_TEMPLATES])
        const templates = JSON.parse(result[KEY_PROMPT_TEMPLATES] ?? '[]');
        resolve(templates);
      });
    });
  } catch (error) {
    console.error('Error reading templates:', error);
    return []
  }
};
<script setup lang="js">
import {ref, onMounted, reactive} from 'vue'
import "../style.css"
import * as storage from "../storage.js"

const promptTemplates = ref([])

onMounted(async () => {
  promptTemplates.value = await storage.readTemplate()
})
const dialogVisible = ref(false)
const addPrompts = () => {
  initPromptModel()
  dialogVisible.value = true
}

const title = ref("Add Prompt Template")

const initPromptModel = () => {
  promptModel.id = crypto.randomUUID()
  promptModel.name = ""
  promptModel.content = `Summarize the following article in 3-5 concise bullet points, highlighting the key information and main takeaways:
Additionally, provide a brief 1-2 sentence overview of the article's main topic.
{article}
`
  promptModel.defaultTemplate = false
}

const promptModel = reactive({
  name: "",
  content: `Summarize the following article in 3-5 concise bullet points, highlighting the key information and main takeaways:
Additionally, provide a brief 1-2 sentence overview of the article's main topic.
{article}
`,
  defaultTemplate: false
})
const saveTemplate = async () => {
  dialogVisible.value = false
  let templates = await storage.readTemplate()
  let isNewItem = true
  templates.forEach((item) => {
    if (promptModel.defaultTemplate) {
      item.defaultTemplate = false
    }
    if (item.id === promptModel.id) {
      item.name = promptModel.name
      item.content = promptModel.content
      item.defaultTemplate = promptModel.defaultTemplate
      isNewItem = false
    }
  })
  if (isNewItem) {
    templates.push({
      id: promptModel.id,
      name: promptModel.name,
      content: promptModel.content,
      defaultTemplate: promptModel.defaultTemplate
    })
  }
  storage.saveTemplate(templates)
  promptTemplates.value = templates
}

const deleteTemplate = async (index) => {
  let templates = await storage.readTemplate()
  const indexToRemove = templates.findIndex(item => item.id === promptModel.id);
  if (indexToRemove !== -1) {
    templates.splice(indexToRemove, 1);
  }
  storage.saveTemplate(templates)
  promptTemplates.value = templates
}

const editTemplate = (index) => {
  let template = promptTemplates.value[index]
  promptModel.id = template.id
  promptModel.name = template.name
  promptModel.content = template.content
  promptModel.defaultTemplate = template.defaultTemplate
  dialogVisible.value = true
}
</script>

<template>
  <main class="mx-24">
    <el-tabs type="border-card">
      <el-tab-pane label="Prompts List">
        <el-button @click="addPrompts" type="primary" class="float-left">Add Prompts</el-button>

        <ul class="divide-y divide-gray-200 clear-both">
          <li v-for="(item, index) in promptTemplates" :key="index" class="py-4 flex items-center justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-medium text-gray-900">{{ item.name }}</h3>
              <p class="mt-1 text-sm text-gray-500 whitespace-pre-wrap">{{ item.content }}</p>
              <span v-if="item.defaultTemplate"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          默认模板
        </span>
            </div>
            <div class="ml-4 flex-shrink-0">
              <button @click="editTemplate(index)"
                      class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2">
                Edit
              </button>
              <button @click="deleteTemplate(index)" class="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded">
                Delete
              </button>
            </div>
          </li>
        </ul>
      </el-tab-pane>
      <el-tab-pane label="GPT Settings">Config</el-tab-pane>
      <el-tab-pane label="Other Settings">
      </el-tab-pane>
    </el-tabs>
    <el-dialog
        v-model="dialogVisible"
        :title="title"
        :fullscreen="false"
        destroy-on-close
    >
      <el-scrollbar style="height: 50vh;">
        <el-form :model="promptModel" label-width="auto" style="max-width: 700px">
          <el-form-item label="Prompt Template Name">
            <el-input v-model="promptModel.name"/>
          </el-form-item>
          <el-form-item label="Prompt Template Content">
            <el-input :autosize="{ minRows: 8}" v-model="promptModel.content" type="textarea"/>
          </el-form-item>
          <el-form-item label="Default Prompt">
            <el-switch v-model="promptModel.defaultTemplate"/>
          </el-form-item>
        </el-form>
      </el-scrollbar>


      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">Cancel</el-button>
          <el-button type="primary" @click="saveTemplate">
            Save
          </el-button>
        </div>
      </template>
    </el-dialog>

  </main>
</template>

<style>

</style>

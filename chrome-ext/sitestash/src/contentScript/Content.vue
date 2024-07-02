<script setup lang="js">
import TurndownService from "turndown"
import {ref, onMounted, reactive, nextTick, watch, watchEffect} from 'vue'
import Editor from '@toast-ui/editor';
import * as storage from "../storage.js"
import '@toast-ui/editor/dist/toastui-editor.css';
import {ElNotification} from 'element-plus'
const dialogVisible = ref(false)
const isSelecting = ref(false)
const title = ref("")
const article = ref("hello world")
const toastuiEditor = ref(null)
const canvasDiv = ref(null)
const prompts = ref([])
let editor
watchEffect(() => {
  if (toastuiEditor.value) {
    console.log(toastuiEditor.value)
    console.log(article.value)
    editor = new Editor({
      el: toastuiEditor.value,
      previewStyle: 'vertical',
      height: '500px',
      initialValue: article.value
    })
  }
})
onMounted(async() => {
  prompts.value = await storage.readTemplate()
  let hoveredElement = null;
  title.value = document.title

  document.addEventListener('mousemove', (e) => {
    if (!isSelecting.value) {
      return;
    }
    if (hoveredElement) {
      hoveredElement.style.outline = '';
    }
    hoveredElement = e.target;
    hoveredElement.style.outline = '4px solid red';
  });

  document.addEventListener('click', (e) => {
    if (!isSelecting.value) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    let documentClone = hoveredElement.cloneNode(true);
    //let parsedArticle = new Readability(documentClone).parse();
    let turndownService = new TurndownService()
    let markdown = turndownService.turndown(documentClone)
    console.log(markdown)
    article.value = markdown;
    dialogVisible.value = true
    isSelecting.value = false;
    hoveredElement.style.outline = '';
  });
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault();
      if (dialogVisible.value) {
        return
      }
      isSelecting.value = true;
      ElNotification({
        title: 'Site Stash',
        message: 'Move your mouse to select text area',
        type: 'success',
      })
    }
    if (e.key === 'Escape' && isSelecting.value) {
      isSelecting.value = false;
      if (hoveredElement) {
        hoveredElement.style.outline = '';
      }
    }
  });

  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getPageTitle") {
      isSelecting.value = true;
      ElNotification({
        title: 'Site Stash',
        message: 'Move your mouse to select text area',
        type: 'success',
      })
    }
  });
})
const generateContent = () => {

}

const settings = () => {
  console.log("settings")
  chrome.runtime.sendMessage({action: "openOptionsPage"});
}

const forms = reactive({
  prompt: ""
})
const dynamicTags = ref(['Tag 1', 'Tag 2', 'Tag 3'])
const handleClose = (tag) => {
  dynamicTags.value.splice(dynamicTags.value.indexOf(tag), 1)
}
const inputVisible = ref(false)
const InputRef = ref(null)
const inputValue = ref('')
const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    InputRef.value.input.focus()
  })
}
const handleInputConfirm = () => {
  if (inputValue.value) {
    dynamicTags.value.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}
watch(article, (newValue, oldValue) => {
  console.log(`watch: count changed from ${oldValue} to ${newValue}`);
  if (editor) {
    editor.setMarkdown(newValue)
  }
});
</script>

<template>
  <el-dialog
      v-model="dialogVisible"
      :title="title"
      :fullscreen="true"
      destroy-on-close
  >
    <div style="height: 85vh;">


      <el-form :inline="true" :model="forms">
        <el-form-item label="Prompt Select">
          <el-select
              v-model="forms.prompt"
              placeholder="Prompt Select"
              clearable
          >
            <el-option
                v-for="item in prompts"
                :key="item.id"
                :label="item.name"
                :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateContent">Generate Content</el-button>
          <el-button @click="settings">Settings</el-button>
        </el-form-item>
      </el-form>
      <div class="flex gap-2">
        KeyWords:
        <el-tag
            v-for="tag in dynamicTags"
            :key="tag"
            closable
            :disable-transitions="false"
            @close="handleClose(tag)"
        >
          {{ tag }}
        </el-tag>
        <el-input
            v-if="inputVisible"
            ref="InputRef"
            v-model="inputValue"
            class="w-20"
            size="small"
            @keyup.enter="handleInputConfirm"
            @blur="handleInputConfirm"
        />
        <el-button v-else class="button-new-tag" size="small" @click="showInput">
          + New Tag
        </el-button>
      </div>
      <el-tabs type="border-card" style="margin-top: 20px">
        <el-tab-pane label="GPT Output">
          GPT Output
        </el-tab-pane>
        <el-tab-pane label="Origin Content">
          <div ref="toastuiEditor"></div>
        </el-tab-pane>
      </el-tabs>
    </div>


    <template #footer>
      <div class="dialog-footer">
        <el-button @click="dialogVisible = false">Cancel</el-button>
        <el-button type="primary" @click="dialogVisible = false">
          Confirm
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.el-select {
  --el-select-width: 220px;
}
</style>

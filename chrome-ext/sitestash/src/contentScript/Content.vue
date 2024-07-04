<script setup lang="js">
import TurndownService from "turndown"
import {ref, onMounted, reactive, nextTick, watch, watchEffect, onBeforeUnmount} from 'vue'
import Editor from '@toast-ui/editor';
import * as storage from "../storage.js"
import '@toast-ui/editor/dist/toastui-editor.css';
import {ElMessage} from 'element-plus'
import "element-plus/theme-chalk/el-message.css"
const dialogRef = ref(null)
const dialogVisible = ref(false)
const isSelecting = ref(false)
const title = ref("")
const article = ref("hello world")
const gptOutput = ref("")
const toastuiEditor = ref(null)
const prompts = ref([])
let editor
watchEffect(() => {
  if (toastuiEditor.value) {
    editor = new Editor({
      el: toastuiEditor.value,
      previewStyle: 'vertical',
      height: '500px',
      initialValue: article.value
    })
  }
})
const reloadTemplate = async () => {
  if (document.hidden) {
  } else {
    prompts.value = await storage.readTemplate()
    const getDefaultPrompt = () => prompts.value.find(item => item.defaultTemplate);

    if (forms.promptId === '') {
      // 当 forms.promptId 为空字符串时，读取默认模板
      forms.promptId = getDefaultPrompt()?.id ?? '';
    } else {
      // 当 forms.promptId 不为空，检查是否存在于 prompts.value 中
      const promptExists = prompts.value.some(item => item.id === forms.promptId);
      if (!promptExists) {
        // 如果在 prompts.value 中找不到这个 id，置为默认模板
        forms.promptId = getDefaultPrompt()?.id ?? '';
      }
    }
  }
};
onMounted(async () => {
  document.addEventListener('visibilitychange', reloadTemplate);
  await reloadTemplate()
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
    let turndownService = new TurndownService()
    let markdown = turndownService.turndown(documentClone)
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
      ElMessage({
        showClose: true,
        message: 'Move your mouse to select text area',
        type: 'success'
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
    if (request.action === "SiteStash") {
      isSelecting.value = true;
      ElMessage({
        showClose: true,
        message: 'Move your mouse to select text area',
        type: 'error'
      })
    }
    if (request.action === "SelectText") {
      article.value = request.text;
      dialogVisible.value = true
    }
    if (request.action === "message") {
      ElMessage({
        showClose: true,
        message: request.message,
        type: 'error'
      })
    }
    if (request.action === "gptOutputStart") {
      gptOutput.value = ""
    }
    if (request.action === "gptOutput") {
      gptOutput.value = gptOutput.value + request.message
    }
    if(request.action === "generateTagsResponse"){
      dynamicTags.value = request.message.split(",")
    }

  });
})
const generateContent = () => {
  if (forms.promptId === "") {
    ElMessage({
      showClose: true,
      message: 'Please specify prompt template before generate Content',
      type: 'error'
    })
    return
  }
  chrome.runtime.sendMessage({action: 'generateContent', promptId: forms.promptId, article: article.value})
}

const generateTags = ()=>{
  chrome.runtime.sendMessage({action: 'generateTags', article: article.value})
}

const settings = () => {
  chrome.runtime.sendMessage({action: "openOptionsPage"});
}

const forms = reactive({
  promptId: ""
})
const dynamicTags = ref([])
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
  if (editor) {
    editor.setMarkdown(newValue)
  }
  //generateTags()
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', reloadTemplate);
});
</script>

<template>
  <el-dialog
      v-model="dialogVisible"
      :title="title"
      :fullscreen="true"
      destroy-on-close
  >
    <div ref="dialogRef"></div>
    <el-scrollbar style="height: 85vh;">


      <el-form :inline="true" :model="forms">
        <el-form-item label="Prompt Select">
          <el-select
              v-model="forms.promptId"
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
        <el-button type="primary" @click="generateTags">Generate Tags</el-button>
      </div>
      <el-tabs type="border-card" style="margin-top: 20px">
        <el-tab-pane label="GPT Output">
          <pre>{{ gptOutput }}</pre>
        </el-tab-pane>
        <el-tab-pane label="Origin Content">
          <div ref="toastuiEditor"></div>
        </el-tab-pane>
      </el-tabs>
    </el-scrollbar>


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

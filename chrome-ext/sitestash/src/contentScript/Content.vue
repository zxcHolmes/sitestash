<script setup lang="js">
import {Readability} from '@mozilla/readability'
import TurndownService from "turndown"
import {ref, onMounted} from 'vue'
import {ElMessageBox} from 'element-plus'
import {MdEditor} from 'md-editor-v3';
import 'md-editor-v3/lib/style.css';
import {ElNotification} from 'element-plus'

const dialogVisible = ref(false)
const isSelecting = ref(false)
const title = ref("")
const article = ref("hello world")
onMounted(() => {
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
        title: 'Success',
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
        title: 'Success',
        message: 'Move your mouse to select text area',
        type: 'success',
      })
    }
  });
})
</script>

<template>
  <el-dialog
      v-model="dialogVisible"
      :title="title"
      :fullscreen="true"
      destroy-on-close
  >
    <el-scrollbar>
      <MdEditor v-model="article"/>
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

</style>
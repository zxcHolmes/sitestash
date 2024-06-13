<script setup lang="js">
import {Readability} from '@mozilla/readability'
import TurndownService from "turndown"
import {ref, onMounted} from 'vue'
import {ElMessageBox} from 'element-plus'

const dialogVisible = ref(false)

const article = ref("hello world")
onMounted(() => {
  chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "getPageTitle") {
      console.log(document)
      let documentClone = document.cloneNode(true);
      let parsedArticle = new Readability(documentClone).parse();
      let turndownService = new TurndownService()
      let markdown = turndownService.turndown(parsedArticle.content)
      console.log(markdown)
      console.log(parsedArticle)
      article.value = parsedArticle.content;
      dialogVisible.value = true
    }
  });
})
</script>

<template>
  <el-dialog
      v-model="dialogVisible"
      title="Tips"
      width="960"
      destroy-on-close
  >
    <el-scrollbar height="400px">
      <div v-html="article"></div>
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
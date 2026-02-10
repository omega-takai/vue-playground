<script setup lang="ts"></script>

<template>
  <router-view />
</template>

<style>
/* Google Fontsから Noto Sans JP を読み込み */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;600;700&display=swap');

/* グローバルスタイルのリセット */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans JP', sans-serif;
  background-color: #ffffff;
  color: #2c3e50;
  line-height: 1.6;
}

#app {
  min-height: 100vh;
}
</style>

<template>
  <header class="zh-lx-navbar">
    <img :src="logo" alt="logo" class="logo" />
  </header>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import Config from '../config';

export default defineComponent({
  setup() {
    const configOptions = reactive(Config);
    return {
      ...configOptions,
    };
  },
});
</script>

<style scoped lang="less">
.zh-lx-navbar {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  box-sizing: border-box;
  padding: 8px 16px;
  height: 56px;
  .logo {
    height: 40px;
    width: 40px;
  }
}
</style>

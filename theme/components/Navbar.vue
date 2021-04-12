<template>
  <header class="zh-lx-navbar">
    <div class="left">
      <img :src="logo" alt="logo" class="logo" />
      <div class="site-title">{{ siteConfig.title || "Zlx's Blog" }}</div>
    </div>
  </header>
</template>

<script lang="ts">
import { defineComponent, reactive } from 'vue';
import { useThemeData } from '@vuepress/plugin-theme-data/lib/composables';
import { useSiteData } from '@vuepress/client';
import logo from '@assets/logo.png';

export default defineComponent({
  setup() {
    const themeConfig = useThemeData();
    const siteConfig = useSiteData();
    return {
      themeConfig,
      siteConfig,
      logo,
    };
  },
});
</script>

<style scoped lang="less">
@import '~@styles/color.less';
.zh-lx-navbar {
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  box-sizing: border-box;
  padding: 8px 16px;
}
.left {
  display: flex;
  align-items: center;
  .logo {
    height: 30px;
    width: 30px;
  }
  .site-title {
    margin-left: 4px;
    font-weight: bold;
    font-size: 20px;
    color: @title-color;
    font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen,
      Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
  }
}
</style>

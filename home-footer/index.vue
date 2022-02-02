<template>
  <div class="site-info">
    <a class="site-code" href="https://beian.miit.gov.cn/"
      >鲁ICP备20023182号-1</a
    >
    <a class="copy-right" href="javascript:;">CopyRight@2022</a>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
.site-info {
  width: 100vw;
  height: 68px;
  margin-top: 20px;
  border-top: var(--common-border);
  display: flex;
  justify-content: center;
  align-items: center;
  .site-code {
    color: var(--common-text-color);
    &:hover {
      color: var(--theme-color);
    }
  }
  .copy-right {
    color: var(--common-text-color);
    border-left: var(--common-border);
    padding-left: 12px;
    margin-left: 12px;
  }
}
</style>

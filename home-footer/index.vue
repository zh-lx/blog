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
  border-top: 1px solid var(--wc-border-light);
  display: flex;
  justify-content: center;
  align-items: center;
  .site-code {
    color: var(--wc-text-primary);
    &:hover {
      color: var(--wc-text-brand);
    }
  }
  .copy-right {
    color: var(--wc-text-primary);
    border-left: 1px solid var(--wc-border-primary);
    padding-left: 12px;
    margin-left: 12px;
  }
}
</style>

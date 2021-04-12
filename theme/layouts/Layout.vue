<template>
  <div class="zh-lx-theme">
    <Navbar />
    <Content />
  </div>
</template>

<script lang="ts">
import { defineComponent, onMounted } from 'vue';

import Navbar from '@components/Navbar.vue';

export default defineComponent({
  components: { Navbar },
  setup() {
    return {};
  },
});
</script>

<style scoped lang="less">
.zh-lx-theme {
  padding-top: 46px;
}
</style>

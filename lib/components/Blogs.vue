<template>
  <div class="blog-list">1111</div>
</template>

<script lang="ts">
import { defineComponent, computed, ref } from 'vue';
import { usePagesInfo } from '../composables';

export default defineComponent({
  name: 'Blogs',
  setup() {
    let pages;
    usePagesInfo().then((blogs) => {
      pages = blogs;
    });
    return { pages };
  },
});
</script>

<style scoped lang="less">
.blog-list {
  padding: 0.7rem 1.5rem;
}
</style>

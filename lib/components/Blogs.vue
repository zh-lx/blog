<template>
  <div class="blog-list">
    <div v-for="(blog, index) in pages" :key="index" class="blog-item-div">
      <BlogItem :blog="blog" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, watch, ref, onMounted } from 'vue';
import { usePagesInfo } from '../composables';
import BlogItem from './BlogItem.vue';

export default defineComponent({
  name: 'Blogs',
  components: {
    BlogItem,
  },
  setup() {
    let pages = ref([]);
    usePagesInfo().then((blogs) => {
      pages.value = blogs.value;
      console.log(pages.value);
    });

    return { pages };
  },
});
</script>

<style scoped lang="less">
.blog-list {
  padding: 0.7rem 1.5rem;
  .blog-item-div {
    margin-bottom: 1rem;
  }
}
</style>

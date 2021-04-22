<template>
  <div class="card">
    <div class="blog-title">{{ blog.title }}</div>
    <div class="blog-git-info">
      <div class="git-author git-item">
        <i class="el-user-solid blog-icon"></i
        ><span>{{ blog.git.contributors?.[0].name }}</span>
      </div>
      <div class="git-time git-item">
        <i class="ea-clock-o blog-icon"></i
        ><span>{{ formatTime(blog.git.updatedTime || 0, 'yyyy-MM-dd') }}</span>
      </div>
      <div class="tag git-item">
        <i class="ei-tags blog-icon"></i>
        <span>{{
          blog.frontmatter?.tag?.join?.('') || blog.frontmatter?.tag
        }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { formatTime } from '@/utils/index';
import 'easy-icon';
import 'easy-icon/easy-icon-l.js';
import 'easy-icon/easy-icon-a.js';

export default defineComponent({
  name: 'BlogItem',
  props: {
    blog: Object,
    default: () => {},
  },
  setup(props) {
    return {
      ...toRefs(props),
      formatTime,
    };
  },
});
</script>

<style scoped lang="scss">
@import '~@/styles/_variables.scss';
.blog-title {
  font-size: 20px;
  font-family: Ubuntu, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto,
    Oxygen, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif;
}
.blog-git-info {
  display: flex;
  flex-wrap: wrap;
  color: $gitInfoColor;
  .git-item {
    margin-left: 1.8rem;
    min-width: 100px;
    &:first-of-type {
      margin-left: 0;
    }
  }
  .blog-icon {
    margin-right: 4px;
  }
}
</style>

<template>
  <div class="card">
    <div class="blog-title">{{ blog.title }}</div>
    <div class="blog-git-info">
      <div class="git-author">
        <i class="el-user-solid blog-icon"></i
        >{{ blog.git.contributors?.[0].name }}
      </div>
      <div class="git-time">
        <i class="ea-clock-o blog-icon"></i
        >{{ formatTime(blog.git.updatedTime || 0, 'yyyy-MM-dd') }}
      </div>
      <div class="tag"></div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, toRefs } from 'vue';
import { formatTime } from '@/utils/index';
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
  font-weight: bold;
}
.blog-git-info {
  display: flex;
  flex-wrap: wrap;
  .blog-icon {
    color: $iconColor;
  }
}
</style>

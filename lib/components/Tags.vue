<template>
  <div class="tags-box">
    <div
      v-for="tag in tags"
      :key="tag.name"
      class="tag-label pointer"
      :style="{ background: getRandomColor() }"
    >
      {{ decodeURI(tag.name) }}
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { usePagesInfo } from '@/composables';
import { Category } from '@/types';
import { getRandomColor } from '@/utils';

export default defineComponent({
  name: 'Tags',
  setup() {
    let tags = ref<Category[]>([]);
    usePagesInfo().then((blogsInfo) => {
      tags.value = blogsInfo?.tags?.value || [];
    });

    return {
      tags,
      getRandomColor,
    };
  },
});
</script>

<style scoped lang="scss">
.tags-box {
  display: flex;
  flex-wrap: wrap;
  .tag-label {
    margin-right: 12px;
    margin-top: 8px;
    padding: 0 8px;
    height: 24px;
    line-height: 24px;
    border-radius: 4px;
    font-size: 14px;
    &:hover {
      transform: scale(1.1);
    }
    color: var(--reverseTextColor);
    &:last-of-type {
      margin-right: 0;
    }
  }
}
</style>

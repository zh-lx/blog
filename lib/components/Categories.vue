<template>
  <div>
    <div v-for="(category, index) in categories" :key="index">
      <div class="category-item pointer">
        <div class="category-name">{{ decodeURI(category.name) }}</div>
        <div class="category-count">{{ category.count }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { usePagesInfo } from '@/composables';
import { Category } from '@/types';

export default defineComponent({
  name: 'Categories',
  setup() {
    let categories = ref<Category[]>([]);
    usePagesInfo().then((blogsInfo) => {
      categories.value = blogsInfo?.categories?.value || [];
    });

    return {
      categories,
    };
  },
});
</script>

<style scoped lang="scss">
.category-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.2rem 1rem;
  &:hover {
    background-color: var(--commonHoverBgc);
    border-left: 1px solid var(--commonHoverHighLight);
    color: var(--commonHoverHighLight);
  }
  .category-count {
    background-color: var(--commonTextColor);
    color: var(--reverseTextColor);
    font-size: 12px;
    text-align: center;
    height: 18px;
    line-height: 18px;
    min-width: 28px;
    border-radius: 9px;
  }
}
</style>

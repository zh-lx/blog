<template>
  <div class="home-right">
    <div class="author card">
      <img class="author-avatar" src="~@/assets/avatar.jpg" alt="" />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  name: 'HomeRight',
  setup() {
    return {};
  },
});
</script>

<style scoped lang="scss">
.home-right {
  background-color: #f00;
}
.author {
  width: 100%;
  .author-avatar {
    width: 100%;
    height: auto;
  }
}
</style>

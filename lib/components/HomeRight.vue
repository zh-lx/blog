<template>
  <div class="home-right">
    <div class="card author-card">
      <div class="author">
        <img
          class="author-avatar"
          :src="pageData.frontmatter?.author?.avatar || DefaultAvatar"
          alt=""
        />
        <div class="author-name">
          {{ pageData.frontmatter?.author?.name || '神秘人' }}
        </div>
        <div class="author-introduction">
          {{ pageData.frontmatter?.author?.introduction }}
        </div>
      </div>
      <div class="contact">
        <i
          v-if="pageData.frontmatter?.contact?.github"
          class="et-logo-github author-icon"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.qq"
          class="et-logo-qq author-icon"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.csdn"
          class="et-logo-csdn author-icon"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.wechat"
          class="et-logo-wechat author-icon"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.zhihu"
          class="et-zhihu author-icon"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.email"
          class="et-ic-mail author-icon"
        ></i>
      </div>
    </div>
    <!-- <div class="card"></div> -->
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { usePageData } from '@vuepress/client';
import 'easy-icon/easy-icon-t.js';
import 'easy-icon';

const DefaultAvatar = 'https://i.postimg.cc/tJghhbZY/default-avatar.jpg';

export default defineComponent({
  name: 'HomeRight',
  setup() {
    const pageData = usePageData();
    return {
      pageData,
      DefaultAvatar,
    };
  },
});
</script>

<style scoped lang="scss">
.et-logo-github {
  transform: translateY(-1px);
}
.author-icon {
  transform: scale(1.25);
  display: flex;
  justify-content: center;
  align-items: center;
}
.et-ic-mail {
  background-color: #2c3e50;
  border-radius: 50%;
  height: 25px;
  width: 25px;
  color: #fff;
  transform: scale(0.8);
}
.author {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  .author-avatar {
    width: 60%;
    height: auto;
    border-radius: 50%;
  }
  .author-name {
    font-weight: 600;
    margin-top: 1rem;
    font-size: 20px;
  }
  .author-introduction {
    margin-top: 1rem;
  }
}
.contact {
  display: flex;
  justify-content: space-around;
  align-items: center;
  margin-top: 1rem;
}
</style>

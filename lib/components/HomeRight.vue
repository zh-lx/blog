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
          class="et-logo-github author-icon pointer"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.qq"
          class="et-logo-qq author-icon pointer"
          style="color: #4cafe9"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.csdn"
          class="et-logo-csdn author-icon pointer"
          style="color: #fc5531"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.wechat"
          class="et-logo-wechat author-icon pointer"
          style="color: #11d31d"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.zhihu"
          class="et-zhihu author-icon pointer"
          style="color: #1089e9"
        ></i>
        <i
          v-if="pageData.frontmatter?.contact?.email"
          class="et-ic-mail author-icon pointer"
          style="background: #fdb100"
        ></i>
      </div>
    </div>
    <div class="card category-card">
      <div class="category-card-title">
        <i class="ei-folder-open"></i>文章分类
      </div>
      <Categories />
    </div>
    <div class="card tag-card">
      <div class="tag-card-title"><i class="ei-tags"></i>热门标签</div>
      <Tags />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue';
import { usePageData } from '@vuepress/client';
import { usePagesInfo } from '@/composables';
import { Tag, Category } from '@/types';
import 'easy-icon/easy-icon-t.js';
import 'easy-icon';
import Categories from '@/components/Categories.vue';
import Tags from '@/components/Tags.vue';

const DefaultAvatar = 'https://i.postimg.cc/tJghhbZY/default-avatar.jpg';

export default defineComponent({
  name: 'HomeRight',
  components: { Categories, Tags },
  setup() {
    const pageData = usePageData();
    let categories = ref<Category[]>([]);
    let tags = ref<Tag[]>([]);
    usePagesInfo().then((blogsInfo) => {
      categories.value = blogsInfo?.categories?.value || [];
      tags.value = blogsInfo?.tags?.value || [];
    });

    return {
      pageData,
      DefaultAvatar,
      categories,
      tags,
    };
  },
});
</script>

<style scoped lang="scss">
@import '~@/styles/_variables.scss';
.et-logo-github {
  transform: translateY(-1px);
}
.author-icon {
  transform: scale(1.25);
  display: flex;
  justify-content: center;
  align-items: center;
  &:hover {
    transform: scale(1.375);
  }
}
.et-ic-mail {
  background-color: #2c3e50;
  border-radius: 50%;
  height: 25px;
  width: 25px;
  color: #fff;
  transform: scale(0.8);
  &:hover {
    transform: scale(0.88);
  }
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
    color: var(--mainTextColor);
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
.category-card {
  padding-left: 0;
  padding-right: 0;
  margin-top: 1.5rem;
  .category-card-title {
    padding-left: 1rem;
    margin-bottom: 0.5rem;
    i {
      margin-right: 4px;
    }
  }
}
.tag-card {
  margin-top: 1.5rem;
  .tag-card-title {
    margin-bottom: 0.5rem;
    i {
      margin-right: 4px;
    }
  }
}

@media (max-width: $MQMobile) {
  .author-card {
    display: none;
  }
}
</style>

<template>
  <main class="home" :aria-labelledby="heroText ? 'main-title' : null">
    <div class="hero">
      <h1 v-if="heroText" id="main-title">
        {{ heroText }}
      </h1>

      <p v-if="tagline" class="description">
        {{ tagline }}
      </p>

      <div class="left-top-circle"></div>
      <div class="left-bottom-cube"></div>
      <div class="right-top-heart"></div>
      <div class="right-bottom-octagon"></div>
    </div>
    <Blogs />

    <div class="theme-default-content custom">
      <Content />
    </div>

    <template v-if="footer">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div v-if="footerHtml" class="footer" v-html="footer" />
      <div v-else class="footer" v-text="footer" />
    </template>
  </main>
</template>

<script lang="ts">
import { computed, defineComponent } from 'vue';
import {
  usePageFrontmatter,
  useSiteLocaleData,
  withBase,
} from '@vuepress/client';
import type { DefaultThemeHomePageFrontmatter } from '../types';
import NavLink from './NavLink.vue';
import Blogs from './Blogs.vue';

export default defineComponent({
  name: 'Home',

  components: {
    NavLink,
    Blogs,
  },

  setup() {
    const frontmatter = usePageFrontmatter<DefaultThemeHomePageFrontmatter>();
    const siteLocale = useSiteLocaleData();

    const heroImage = computed(() => {
      if (!frontmatter.value.heroImage) {
        return null;
      }

      return withBase(frontmatter.value.heroImage);
    });

    const heroText = computed(() => {
      if (frontmatter.value.heroText === null) {
        return null;
      }
      return frontmatter.value.heroText || siteLocale.value.title || 'Hello';
    });

    const heroAlt = computed(
      () => frontmatter.value.heroAlt || heroText.value || 'hero'
    );

    const tagline = computed(() => {
      if (frontmatter.value.tagline === null) {
        return null;
      }
      return (
        frontmatter.value.tagline ||
        siteLocale.value.description ||
        'Welcome to your VuePress site'
      );
    });

    const footer = computed(() => frontmatter.value.footer);

    const footerHtml = computed(() => frontmatter.value.footerHtml);

    return {
      heroImage,
      heroAlt,
      heroText,
      tagline,
      footer,
      footerHtml,
    };
  },
});
</script>
<style lang="less" scoped>
.hero {
  height: calc(100vh - 3.6rem);
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: url('./assets//homebg.jpg');
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
}
#main-title,
.description {
  color: #fff;
}
</style>

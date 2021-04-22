<template>
  <main class="home" :aria-labelledby="heroText ? 'main-title' : null">
    <div class="hero">
      <h1 v-if="heroText" id="main-title">
        {{ heroText }}
      </h1>

      <p v-if="tagline" class="description">
        {{ tagline }}
      </p>
    </div>

    <div class="home-main">
      <div class="home-main-left"><Blogs /></div>
      <div class="home-main-right"><HomeRight /></div>
    </div>

    <div class="theme-default-content custom">
      <Content />
    </div>

    <template v-if="footer">
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
import HomeRight from './HomeRight.vue';

export default defineComponent({
  name: 'Home',

  components: {
    NavLink,
    Blogs,
    HomeRight,
  },

  setup() {
    const frontmatter = usePageFrontmatter<DefaultThemeHomePageFrontmatter>();
    const siteLocale = useSiteLocaleData();

    const heroText = computed(() => {
      if (frontmatter.value.heroText === null) {
        return null;
      }
      return frontmatter.value.heroText || siteLocale.value.title || 'Hello';
    });

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
      heroText,
      tagline,
      footer,
      footerHtml,
    };
  },
});
</script>

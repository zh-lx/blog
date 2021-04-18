<template>
  <main class="home" :aria-labelledby="heroText ? 'main-title' : null">
    <div class="hero">
      <img v-if="heroImage" :src="heroImage" :alt="heroAlt" />

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

    <div v-if="features.length" class="features">
      <div v-for="feature in features" :key="feature.title" class="feature">
        <h2>{{ feature.title }}</h2>
        <p>{{ feature.details }}</p>
      </div>
    </div>

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
import { isArray } from '@vuepress/shared';
import type { DefaultThemeHomePageFrontmatter } from '../types';
import NavLink from './NavLink.vue';

export default defineComponent({
  name: 'Home',

  components: {
    NavLink,
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

    const features = computed(() => {
      if (isArray(frontmatter.value.features)) {
        return frontmatter.value.features;
      }
      return [];
    });

    const footer = computed(() => frontmatter.value.footer);

    const footerHtml = computed(() => frontmatter.value.footerHtml);

    return {
      heroImage,
      heroAlt,
      heroText,
      tagline,
      features,
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

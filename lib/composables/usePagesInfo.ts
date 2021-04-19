import { usePagesData } from '@vuepress/client';
import { ref } from 'vue';

type Contributor = {
  name: string;
  email: string;
  commits: number;
};

type Header = {
  children: Header[];
  level: number;
  slug: string;
  title: string;
};

type Page = {
  excerpt: string;
  filePathRelative: string;
  frontmatter: { [key: string]: any };
  git: { updatedTime: number; contributors: Contributor[] };
  headers: Header[];
  key: string;
  lang: string;
  path: string;
  title: string;
};

export async function usePagesInfo() {
  const pages = ref<Page[]>([]);
  const pagesData = usePagesData();
  const pagesArr = pagesData.value;
  for (let route in pagesArr) {
    const getPageInfo = pagesArr[route];
    const pageObj = await getPageInfo();
    pages.value.push(pageObj as Page);
  }
  return pages;
}

import { usePagesData } from '@vuepress/client';
import { ref } from 'vue';
import { Blog } from '../types';

export async function usePagesInfo() {
  const pages = ref<Blog[]>([]);
  const pagesData = usePagesData();
  const pagesArr = pagesData.value;
  for (let route in pagesArr) {
    const getPageInfo = pagesArr[route];
    const pageObj = await getPageInfo();
    pages.value.push(pageObj as Blog);
  }
  return pages;
}

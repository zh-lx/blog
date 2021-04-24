import { usePagesData } from '@vuepress/client';
import { ref } from 'vue';
import { Blog, Tag, Category } from '@/types';

export async function usePagesInfo() {
  const blogs = ref<Blog[]>([]);
  const tags = ref<Tag[]>([]);
  const categories = ref<Category[]>([]);

  const pagesData = usePagesData().value;

  for (let route in pagesData) {
    const getPageInfo = pagesData[route];
    const pageObj = await getPageInfo();
    if (
      !(pageObj as any)?.filePathRelative ||
      pageObj.frontmatter.blog === false
    ) {
      continue;
    }
    // 获取tag列表
    const tagArr = getTagsFromFrontmatter(pageObj.frontmatter);
    tagArr.forEach((tag) => {
      const targetTag = tags.value.find((item) => {
        return item.name === tag;
      });
      if (!targetTag) {
        tags.value.push({ name: tag, count: 1 });
      } else {
        targetTag.count++;
      }
    });
    // 获取category列表
    const category = pageObj.path.split('/')[1];
    const targetCategory = categories.value.find((item) => {
      return item.name === category;
    });
    if (!targetCategory) {
      categories.value.push({ name: category, count: 1 });
    } else {
      targetCategory.count++;
    }
    // 获取blog列表
    if (!(pageObj.frontmatter.blog === false)) {
      blogs.value.push(pageObj as Blog);
    }
  }
  return { blogs, tags, categories };
}

function getTagsFromFrontmatter(frontmatter) {
  const { tag } = frontmatter;
  if (typeof tag === 'string') {
    return [tag];
  }
  if (Array.isArray(tag)) {
    return tag;
  }
  return [];
}

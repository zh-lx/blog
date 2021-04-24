export type Contributor = {
  name: string;
  email: string;
  commits: number;
};

export type Header = {
  children: Header[];
  level: number;
  slug: string;
  title: string;
};

export type Blog = {
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

export type Tag = {
  name: string;
  count: number;
};

export type Category = {
  name: string;
  count: number;
};

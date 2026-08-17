import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ResourceFrontmatter = {
  title: string;
  description: string;
  slug: string;
  author: string;
  category: string;
  publishedAt: string;
  updatedAt: string;
  draft?: boolean;
};

export type ResourcePost = ResourceFrontmatter & {
  content: string;
  readingMinutes: number;
};

const RESOURCES_DIR = path.join(process.cwd(), "content", "resources");
const GLOSSARY_DIR = path.join(process.cwd(), "content", "glossary");

function readingMinutes(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

function readMdxDir(dir: string): ResourcePost[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => (file.endsWith(".mdx") || file.endsWith(".md")) && !file.startsWith("_"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const parsed = matter(raw);
      const data = parsed.data as Partial<ResourceFrontmatter>;
      const slug = data.slug || file.replace(/\.mdx?$/, "");
      return {
        title: data.title || slug,
        description: data.description || "",
        slug,
        author: data.author || "SONIL EHS360",
        category: data.category || "EHS",
        publishedAt: data.publishedAt || "",
        updatedAt: data.updatedAt || data.publishedAt || "",
        draft: Boolean(data.draft),
        content: parsed.content,
        readingMinutes: readingMinutes(parsed.content),
      };
    });
}

export function listResourcePosts(includeDrafts = false) {
  return readMdxDir(RESOURCES_DIR)
    .filter((post) => includeDrafts || !post.draft)
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

export function getResourcePost(slug: string) {
  return listResourcePosts(true).find((post) => post.slug === slug) ?? null;
}

export function listGlossaryTerms() {
  return readMdxDir(GLOSSARY_DIR).filter((post) => !post.draft);
}

export function getGlossaryTerm(slug: string) {
  return listGlossaryTerms().find((post) => post.slug === slug) ?? null;
}

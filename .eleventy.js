import markdownIt from "markdown-it";
import { minify } from "html-minifier-terser";
import CleanCSS from "clean-css";
import { readFile, writeFile, unlink } from "node:fs/promises";
import { join } from "node:path";

const md = markdownIt();
const isProd = process.env.ELEVENTY_ENV === "production";

export default function (eleventyConfig) {
  eleventyConfig.addFilter("md", (value) => value ? md.render(value) : "");
  eleventyConfig.ignores.add("_rendered");
  eleventyConfig.ignores.add("_cleaned");
  eleventyConfig.ignores.add("playwright-report");
  eleventyConfig.ignores.add("test-results");
  eleventyConfig.ignores.add("tests");
  eleventyConfig.ignores.add("node_modules");
  eleventyConfig.addPassthroughCopy({
    fonts: "fonts",
    images: "images",

    favicons: "favicons",
    styles: "styles",
  });
  eleventyConfig.addGlobalData("site_title", "Hancock Plumbing Co. Inc.");
  eleventyConfig.addGlobalData("isProd", isProd);
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");

  if (isProd) {
    eleventyConfig.addTransform("htmlmin", async (content, outputPath) => {
      if (outputPath?.endsWith(".html")) {
        return await minify(content, {
          collapseWhitespace: true,
          removeComments: true,
          minifyCSS: true,
          minifyJS: true,
        });
      }
      return content;
    });

    eleventyConfig.on("eleventy.after", async ({ dir }) => {
      const stylesDir = join(dir.output, "styles");
      const cssOrder = ["theme.css", "fonts.css", "site.css"];
      const combined = [];
      for (const file of cssOrder) {
        combined.push(await readFile(join(stylesDir, file), "utf8"));
      }
      const result = new CleanCSS({}).minify(combined.join("\n"));
      await writeFile(join(stylesDir, "style.css"), result.styles);
      for (const file of cssOrder) {
        await unlink(join(stylesDir, file));
      }
    });
  }
}

export default function (eleventyConfig) {
  eleventyConfig.ignores.add("_rendered");
  eleventyConfig.ignores.add("_cleaned");
  eleventyConfig.ignores.add("playwright-report");
  eleventyConfig.ignores.add("test-results");
  eleventyConfig.ignores.add("tests");
  eleventyConfig.ignores.add("node_modules");
  eleventyConfig.addPassthroughCopy({
    __fonts: "__fonts",
    __static: "__static",
    bundle: "bundle",
    favicons: "favicons",
    styles: "styles",
  });
  eleventyConfig.addGlobalData("site_title", "Hancock Plumbing Co. Inc.");
  eleventyConfig.setIncludesDirectory("_includes");
  eleventyConfig.setLayoutsDirectory("_layouts");
}

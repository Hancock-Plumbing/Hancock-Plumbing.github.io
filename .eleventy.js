export default function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy({
    '__fonts': '__fonts',
    '__static': '__static',
    'bundle': 'bundle',
    'favicons': 'favicons',
    'styles': 'styles',
  });
  eleventyConfig.addGlobalData('site_title', 'Hancock Plumbing Co. Inc.');
  eleventyConfig.setIncludesDirectory('_includes');
  eleventyConfig.setLayoutsDirectory('_layouts');
};

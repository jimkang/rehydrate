var pluginRss = require('@11ty/eleventy-plugin-rss');
var fs = require('fs');
var curry = require('lodash.curry');
const yaml = require('yamljs');

module.exports = function(eleventyConfig) {
  eleventyConfig.addDataExtension('yaml', contents => yaml.parse(contents));

  eleventyConfig.addPassthroughCopy('media/*');
  eleventyConfig.addPassthroughCopy('app.css');
  eleventyConfig.addPassthroughCopy('episodes/**/*.mp3');

  eleventyConfig.addCollection(
    'episodes',
    curry(addFilteredCollection)(['episodes/*.njk'], compareDatesDesc)
  );
  eleventyConfig.addCollection(
    'hosts',
    curry(addFilteredCollection)(['hosts/*.njk'], null)
  );

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addFilter('length', getFileLength);
  eleventyConfig.addFilter('getReadingListEntry', getReadingListEntry);
  eleventyConfig.addFilter('getEpisodeTitle', getEpisodeTitle);
  eleventyConfig.addFilter('getEpisodeSubtitle', getEpisodeSubtitle);
};

function compareDatesDesc(a, b) {
  return b.data.stuff.date - a.data.stuff.date;
}

function notIndex(thing) {
  return !thing.inputPath.includes('index.njk');
}

function getFileLength(filePath) {
  var stats = fs.statSync(filePath);
  return stats.size;
}

function addFilteredCollection(glob, sortFn, collection) {
  var filteredCollection = collection.getFilteredByGlob(glob).filter(notIndex);

  if (sortFn) {
    filteredCollection.sort(sortFn);
  }
  return filteredCollection;
}

function getEpisodeTitle(ep) {
  return `Season ${ep.season}, Episode ${ep.number}: ${ep.title}`;
}

function getEpisodeSubtitle(rl) {
  return `${rl.season.title}, Chapters ${rl.episode.chapters.start}-${rl.episode.chapters.end}`;
}

function getReadingListEntry(ep, readingList) {
  let season = readingList.seasons.find(s => s.number === ep.season);
  let episode = season.episodes.find(e => e.number === ep.number);

  return { season, episode };
}

// TODO: Duration filter via music-metadata.

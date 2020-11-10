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
    curry(addFilteredCollection)(['episodes/*.njk'])
  );
  eleventyConfig.addCollection(
    'hosts',
    curry(addFilteredCollection)(['hosts/*.njk'])
  );

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addFilter('length', getFileLength);
  eleventyConfig.addFilter('getReadingListEntry', getReadingListEntry);
};

function compareDatesDesc(a, b) {
  return b.date - a.date;
}

function notIndex(thing) {
  //console.log('thing', thing);
  return !thing.inputPath.includes('index.njk');
}

function getFileLength(filePath) {
  var stats = fs.statSync(filePath);
  return stats.size;
}

function addFilteredCollection(glob, collection) {
  var filteredCollection = collection
    .getFilteredByGlob(glob)
    .filter(notIndex)
    .sort(compareDatesDesc);
  return filteredCollection;
}

function getReadingListEntry(ep, readingList) {
  let season = readingList.seasons.find(s => s.number === ep.season)
  let episode = season.episodes.find(e => e.number === ep.number)

  return {
    season: season,
    episode: episode
  }
}

// TODO: Duration filter via music-metadata.

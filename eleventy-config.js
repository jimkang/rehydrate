var pluginRss = require('@11ty/eleventy-plugin-rss');
var fs = require('fs');
var curry = require('lodash.curry');
const yaml = require('yamljs');

module.exports = function(eleventyConfig) {
  eleventyConfig.addDataExtension('yaml', contents => yaml.parse(contents));

  eleventyConfig.addPassthroughCopy('media/*');
  eleventyConfig.addPassthroughCopy('app.css');
  eleventyConfig.addPassthroughCopy('episodes/**/*.mp3');

  eleventyConfig.addCollection('episodes',
    curry(addFilteredCollection)(['episodes/*.njk'], compareDatesDesc)
  );

  eleventyConfig.addCollection(
    'hosts',
    curry(addFilteredCollection)(['hosts/*.njk'], null)
  );

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addFilter('length', getFileLength);
  eleventyConfig.addFilter('getEpisodeEntry', getEpisodeEntry);
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

function currentEpisodes(episode) {
  let episode_date = episode && episode.data && episode.data.stuff && episode.data.stuff.date

  // If the episode defines a date and it's after current hide it
  if (episode_date && episode_date > new Date()) {
    return false;
  }

  return true;
}

function getFileLength(filePath) {
  var stats = fs.statSync(filePath);
  return stats.size;
}

function addFilteredCollection(glob, sortFn, collection) {
  var filteredCollection = collection.getFilteredByGlob(glob)
  .filter(notIndex)
  .filter(currentEpisodes);

  if (sortFn) {
    filteredCollection.sort(sortFn);
  }
  return filteredCollection;
}

function getEpisodeTitle(ep) {
  return `Season ${ep.season}, Episode ${ep.number}: ${ep.title}`;
}

function getEpisodeSubtitle(rl) {
  if (rl.episode && rl.episode.chapters) {
    return `${rl.season.title}, Chapters ${rl.episode.chapters.start}-${rl.episode.chapters.end}`;
  } else {
    return `${rl.season.title}`
  }
}

function getReadingListEntry(ep, readingList) {
  let season = readingList.seasons.find(s => s.number === ep.season);
  let episode = season.episodes.find(e => e.number === ep.number);

  return { season, episode };
}

function getEpisodeEntry(rl, rlSeason, episodeList) {
  return episodeList.find(e => {
    return e && e.data && e.data.stuff
      && e.data.stuff.season === rlSeason.number 
      && e.data.stuff.number ===  rl.number
  })
}

// TODO: Duration filter via music-metadata.

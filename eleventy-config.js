var pluginRss = require('@11ty/eleventy-plugin-rss');
var fs = require('fs');
var curry = require('lodash.curry');
const yaml = require('yamljs');
const getAtPath = require('get-at-path');

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

  eleventyConfig.addCollection('reactions',
    curry(addFilteredCollection)(['reactions/*.njk'], compareDatesDesc)
  );

  eleventyConfig.addPlugin(pluginRss);
  eleventyConfig.addFilter('length', getFileLength);
  eleventyConfig.addFilter('getEpisodeForReadingListEntry', getEpisodeForReadingListEntry);
  eleventyConfig.addFilter('getReadingListEntry', getReadingListEntry);
  eleventyConfig.addFilter('getEpisodeTitle', getEpisodeTitle);
  eleventyConfig.addFilter('getEpisodeSubtitle', getEpisodeSubtitle);
  eleventyConfig.addFilter('getLastBuildDate', getLastBuildDate);
  eleventyConfig.addFilter('rfc822Date', rfc822Date);
  eleventyConfig.addFilter('findEpisode', findEpisode);
  eleventyConfig.addFilter('getEpisodeFilename', getEpisodeFilename);
  eleventyConfig.addFilter('getEpisodeTweetSummary', getEpisodeTweetSummary);
};

function compareDatesDesc(a, b) {
  return b.data.stuff.date - a.data.stuff.date;
}

function notIndex(thing) {
  return !thing.inputPath.includes('index.njk');
}

function currentEpisodes(episode) {
  let episode_date = getAtPath(episode, ['data', 'stuff', 'date'])

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
  let number = []

  if (ep.season) {
    number.push(`Season ${ep.season}`)
  }

  if (ep.number) {
    number.push(`Episode ${ep.number}`)
  }

  let title = []

  if (number.length > 0) {
    title.push(number.join(", "))
  }
  title.push(ep.title)

  return title.join(": ");
}

function getEpisodeSubtitle(rl) {
  titleParts = [rl.season.title]

  if (rl.episode && rl.episode.chapters && rl.episode.chapters.part) {
    titleParts.push(`Part ${rl.episode.chapters.part}`)
  }

  if (rl.episode && rl.episode.chapters) {
    titleParts.push(`Chapters ${rl.episode.chapters.start}-${rl.episode.chapters.end}`);
  }

  return titleParts.join(", ")
}

function findEpisode(episodeList, seasonNumber, episodeNumber) {
  return episodeList.find(e => {
    return getAtPath(e, ['data', 'stuff', 'season']) === seasonNumber
      && getAtPath(e, ['data', 'stuff', 'number']) === episodeNumber
  })
}

function getReadingListEntry(ep, readingList) {
  let season = readingList.seasons.find(s => s.number === ep.season);
  let episode = season.episodes.find(e => e.number === ep.number);

  return { season, episode };
}

function getEpisodeForReadingListEntry(readingListEntry, readingListSeason, episodeList) {
  return episodeList.find(e => {
    return getAtPath(e, ['data', 'stuff', 'season']) === readingListSeason.number
      && getAtPath(e, ['data', 'stuff', 'number']) === readingListEntry.number
  })
}

function getLastBuildDate(episodes) {
  let lastPubDate = null

  episodes.forEach(episode => {
    ep = episode.data.stuff
    if (lastPubDate == null) {
      lastPubDate = ep.date
    } else if (lastPubDate < ep.date) {
      lastPubDate = ep.date
    }
  });

  return lastPubDate || new Date()
}

function getEpisodeFilename(episode) {
  parts = ["rehydrate"]

  if (episode.season) { parts.push(`s${episode.season}`) }
  if (episode.number) { parts.push(`ep${episode.number}`) }
  if (episode.slug) { parts.push(episode.slug) }

  return `${parts.join('-')}.mp3`
}

function getEpisodeTweetSummary(episode, rl) {
  parts = [
    `Rehydrate: Season ${episode.season}, Episode ${episode.number}`,
    `${episode.title}`,
    `${rl.season.title} by ${rl.season.author }`,
    ""
  ]

  if (rl.episode && rl.episode.chapters) {
    if (rl.episode.chapters.part) {
      parts.push(`${rl.episode.chapters.part }`)
    }

    if (rl.episode.chapters.start && rl.episode.chapters.end) {
      parts.push(`Chapters: ${rl.episode.chapters.start} - ${rl.episode.chapters.end}`)
    }
  }

  parts.push("", "")

  return parts.join("%0a")
}

function rfc822Date(date) {
  return date.toUTCString()
}

// TODO: Duration filter via music-metadata.

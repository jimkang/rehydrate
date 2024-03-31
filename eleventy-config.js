var pluginRss = require('@11ty/eleventy-plugin-rss');
var fs = require('fs');
var curry = require('lodash.curry');
const yaml = require('yamljs');
const getAtPath = require('get-at-path');
const sass = require("sass");

const hostsExcludeExternal = ['jim']

module.exports = function (eleventyConfig) {
	eleventyConfig.setServerPassthroughCopyBehavior("passthrough");

	eleventyConfig.addDataExtension('yaml', contents => yaml.parse(contents));

	// SCSS support
	eleventyConfig.addTemplateFormats("scss");

	// Creates the extension for use
	eleventyConfig.addExtension("scss", {
		outputFileExtension: "css", // optional, default: "html"

		// `compile` is called once per .scss file in the input directory
		compile: async function (inputContent) {
			let result = sass.compileString(inputContent);

			// This is the render function, `data` is the full data cascade
			return async (data) => {
				return result.css;
			};
		},
	});

	eleventyConfig.addPassthroughCopy('media/*');
	eleventyConfig.addPassthroughCopy('app.scss');
	eleventyConfig.addPassthroughCopy('episodes/**/*.mp3');

	eleventyConfig.addCollection('episodes',
		curry(addFilteredCollection)(['episodes/*.njk'], compareDatesDesc, null)
	);

	eleventyConfig.addCollection('external_episodes',
		curry(addFilteredCollection)(['episodes/*.njk'], compareDatesDesc, (episode) => {
			// Filter out the episode if any of the hosts are in the exclusion list
			// console.log(episode.data.stuff.hosts)
			if (!episode.data.stuff.hosts) {
				console.log(episode.data.stuff.title)
			}
			return episode.data.stuff && !hostsExcludeExternal.some(excludedHost => episode.data.stuff.hosts.includes(excludedHost))
		})
	);

	eleventyConfig.addCollection(
		'hosts',
		curry(addFilteredCollection)(['hosts/*.njk'], null, null)
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
	eleventyConfig.addFilter('getEpisodeLink', getEpisodeLink);
};

function getEpisodeLink(episode, readingListEntry, useSummary) {
	if (episode) {
		let stuff = episode.data.stuff

		let seasonParts = [];
		if (stuff.season) {
			seasonParts.push(`Season ${stuff.season}`)
		}
		if (stuff.number) {
			seasonParts.push(`Ep. ${stuff.number}`)
		}

		let url = episode.page.url;
		if (useSummary && stuff.episodeSummary) {
			console.log(stuff.episodeSummary)
			url = stuff.episodeSummary
		}

		let data = {
			url: url,
			image: stuff.imageFilename,
			page_url: episode.page.url,
			title: stuff.title,
			seasonTitle: seasonParts.join(", "),
			summary: stuff.episodeSummary
		}

		return data;

		// let episodeLinkParts = [
		// 	`<a href="${url}">
      //       <img src="/media/${stuff.imageFilename}" class="prev-next-image" alt="Episode image" />
      // </a>`,
		// 	`<a href="${episode.page.url}">
      //       <span class="prev-next-title">${stuff.title}</span>
      // </a>`,
		// 	`<span class="prev-next-season">${seasonParts.join(", ")}</span>`,
		// ]
	  //
		// if (stuff.episodeSummary) {
		// 	episodeLinkParts.push(`<a href="${stuff.episodeSummary}">
      //       <span class="prev-next-summary">Summary</span>
      // </a>`)
		// }
	  //
		// return episodeLinkParts.join("<br />")
	} else {
		return null;
	}
}

function compareDatesDesc(a, b) {
	if (b.data.stuff.date !== a.data.stuff.date) {
		return b.data.stuff.date - a.data.stuff.date;
	} else if (b.data.stuff.season !== a.data.stuff.season) {
		return b.data.stuff.season - a.data.stuff.season
	} else {
		return b.data.stuff.number - a.data.stuff.number
	}
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

function addFilteredCollection(glob, sortFn, filterFn, collection) {
	var filteredCollection = collection.getFilteredByGlob(glob)
		.filter(notIndex)
		.filter(currentEpisodes);

	if (filterFn) {
		console.log(filterFn)
		filteredCollection = filteredCollection.filter(filterFn)
	}

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

	if (rl.episode && rl.episode.episodes) {
		titleParts.push(`Episodes ${rl.episode.episodes.start}-${rl.episode.episodes.end}`);
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

	return {season, episode};
}

function getEpisodeForReadingListEntry(readingListEntry, readingListSeason, episodeList) {
	return episodeList.find(e => {
		return (getAtPath(e, ['data', 'stuff', 'season']) || 0) === readingListSeason.number
			&& (getAtPath(e, ['data', 'stuff', 'number']) || 0) === readingListEntry.number
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

	if (episode.season) {
		parts.push(`s${episode.season}`)
	}
	if (episode.number == 0 || episode.number) {
		parts.push(`ep${episode.number}`)
	}
	if (episode.slug) {
		parts.push(episode.slug)
	}

	return `${parts.join('-')}.mp3`
}

function getEpisodeTweetSummary(episode, rl) {
	parts = [
		`Rehydrate: Season ${episode.season}, Episode ${episode.number}`,
		`${episode.title}`,
		`${rl.season.title} by ${rl.season.author}`,
		""
	]

	if (rl.episode && rl.episode.chapters) {
		if (rl.episode.chapters.part) {
			parts.push(`${rl.episode.chapters.part}`)
		}

		if (rl.episode.chapters.start && rl.episode.chapters.end) {
			parts.push(`Chapters: ${rl.episode.chapters.start} - ${rl.episode.chapters.end}`)
		}
	}

	if (rl.episode && rl.episode.episodes) {
		if (rl.episode.episodes.start && rl.episode.episodes.end) {
			parts.push(`Chapters: ${rl.episode.episodes.start} - ${rl.episode.episodes.end}`)
		}
	}

	parts.push("", "")

	return parts.join("%0a")
}

function rfc822Date(date) {
	return date.toUTCString()
}

// TODO: Duration filter via music-metadata.

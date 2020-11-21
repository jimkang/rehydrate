# rehydrate

The source for the [Rehydrate podcast](https://rehydrate.space/). Uses eleventy to build the feed and site. Maybe you can use this to make your own podcast?

## Installation

- Clone this repo.
- Record your own podcast episodes.
- Update the config files.
- `npm install`
- Create a config.mk that defines `USER` and `SERVER`.

## Usage

Whenever you add a new episode, put the new audio file down, fill out a new Markdown file, then run:

    make build
    make pushall

## Development

After making changes and before committing:

- If your editor is not already configured to run prettier while you edit code, run `make prettier` to format the code.
  - If you don't already have prettier installed: `npm i -g prettier`.
- If you've done a lot with yaml, send the yaml through yamllint.com, assuming there's no sensitive information in the yaml.
- Run `make build`.
- Run a web server using `<project root>/rehydrate` as the root.
  - `make serve` - Sets up an auto-reloading server
  - `cd rehydrate && python -m SimpleHTTPServer`
  - `docker run --rm -it -p 8000:80 --name some-nginx -v $(pwd)/rehydrate:/usr/share/nginx/html:ro nginx`
- Make sure the site is OK locally.

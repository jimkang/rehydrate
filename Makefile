include config.mk

HOMEDIR = $(shell pwd)

build:
	npx @11ty/eleventy \
    --config=eleventy-config.js \
    --output=rehydrate

serve:
	npx @11ty/eleventy \
		--output=rehydrate \
		--config=eleventy-config.js \
		--serve

pushall: sync
	git push origin main

sync:
	s3cmd sync --acl-public rehydrate/ s3://$(BUCKET)/$(APPDIR)/

prettier:
	prettier --single-quote --write "**/*.js"

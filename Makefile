include config.mk

HOMEDIR = $(shell pwd)

build:
	npx @11ty/eleventy \
    --config=eleventy-config.js \
    --output=rehydrate

pushall: sync
	git push origin main

sync:
	s3cmd sync --acl-public rehydrate/ s3://$(BUCKET)/$(APPDIR)/

prettier:
	prettier --single-quote --write "**/*.js"

# convenient Makefile
SHELL   = /bin/bash
.ONESHELL:

# installation
node_modules:
	npm install

.PHONY: dev
dev: node_modules
	# front-end: "make web" pour lancer le serveur local de tests (react-native en web)

# mise à jour…
.PHONY: update
update: node_modules
	npm install npm-check-updates
	./node_modules/.bin/ncu -u
	npm install
	echo "# PLEASE FIX MANUALLY BEFORE COMMIT"

# nettoyage
.PHONY: clean.dev
clean.dev: clean clean.npm

.PHONY: clean
clean:
	$(RM) *~
	$(RM) -r dist

.PHONY: clean.npm
clean.npm:
	$(RM) -r node_modules
	$(RM) package-lock.json

# tests
.PHONY: web
web: node_modules
	npm run web

.PHONY: deploy
deploy: node_modules
	projet=$$(sed -n -e "s/^export default function \([^ ]*\)().*$$/\1/p" App.tsx| tr '[A-Z]' '[a-z]')
	url=$$(grep -E "^ *export +const +baseUrl" src/common/const.ts | sed -n -e "s/.*['\"]\([^'\"]*\)['\"].*/\1/p")
	echo "# projet=$$projet URL=$$url"
	[ "$$url" = "https://$$projet.mobapp.minesparis.psl.eu/api" ] || {
	  echo "# ERROR base url ($$url) not set for release"
	  exit 1
	}
	npx react-native build-android --mode=release
	npm run android -- --mode=release

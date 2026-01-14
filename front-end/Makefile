# convenient Makefile

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

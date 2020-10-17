doc:
	npx jsdoc --configure jsdoc.conf.json --recurse lib/
fmt:
	npx prettier --write lib/
test:
	./node_modules/mocha/bin/mocha '**/tests/*.js' --recursive

fmt:
	npx prettier --write lib/
test:
	./node_modules/mocha/bin/mocha '**/tests/*.js' --recursive

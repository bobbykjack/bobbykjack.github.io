jssource = js/global.js \
		   js/json-ld.js \
		   js/settings.js \
		   js/sort-table.js \
		   js/stats.js \
		   js/table-groups.js

all: js/scripts.js css/styles.css

clean:
	rm js/scripts.js css/styles.css

js/scripts.js: $(jssource)
	cat $(jssource) > js/scripts.js

css/styles.css: css/styles.scss
	sass css/styles.scss > css/styles.css

js/json-ld.js:
	php scripts/build-json-ld.php

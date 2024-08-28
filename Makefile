jssource = js/global.js \
		   js/json-ld.js \
		   js/settings.js \
		   js/sort-table.js \
		   js/stats.js \
		   js/table-groups.js

all: js/scripts.js \
	css/styles.css \
	2022/11/29/all-reviews.html \
	2021/06/25/game-progress2.html \
	2020/03/16/all-switch-purchases2.html

clean:
	rm js/scripts.js css/styles.css

js/scripts.js: $(jssource)
	cat $(jssource) > js/scripts.js

css/styles.css: css/styles.scss
	sass css/styles.scss > css/styles.css

js/json-ld.js:
	php scripts/build-json-ld.php

2022/11/29/all-reviews.html: tpl/2022/11/29/all-reviews.html json/games.json
	php scripts/build-all-reviews.php

2021/06/25/game-progress2.html: tpl/2021/06/25/game-progress.html json/games.json
	php scripts/build-game-progress.php

2020/03/16/all-switch-purchases2.html: tpl/2020/03/16/all-switch-purchases.html json/games.json
	php scripts/build-all-switch-purchases.php

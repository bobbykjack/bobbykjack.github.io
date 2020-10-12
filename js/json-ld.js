// load json-ld data file
var request = new XMLHttpRequest(),
    canon = document.querySelector("link[rel=canonical]"),
    path;

if (canon) {
    path = new URL(canon.getAttribute("href")).pathname;
    request.addEventListener("load", process_json_ld);
    request.open("GET", "/js/json-ld.json");
    request.send();
}

/**
 * look up current page's canonical url in the map
 */
function process_json_ld() {
    var data = JSON.parse(this.responseText);

    if (data.hasOwnProperty(path)) {
        inject_json_ld(data[path]);
    }
}

/**
 * inject into document
 */
function inject_json_ld(data) {
    var el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify(data);
    document.querySelector('head').appendChild(el);
}

//------------------------------------------------------------------------------
// settings.js 
//------------------------------------------------------------------------------

var default_settings = {
    "version": 1.0,
    "data": {
        "links": ""
    }
};

var settings = JSON.parse(localStorage.getItem("settings")) || default_settings;

if (settings.data.links) {
    document.querySelectorAll("a").forEach(function(node) {
        var url = new URL(node.getAttribute("href"), window.location);

        if (window.location.origin != url.origin) {
            node.setAttribute("target", settings.data.links);
        }
    });
}

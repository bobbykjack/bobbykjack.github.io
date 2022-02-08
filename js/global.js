//------------------------------------------------------------------------------
// global.js 
//------------------------------------------------------------------------------

;(function() {

document.querySelectorAll(".jsshow").forEach(function(node) {
    node.classList.remove("jsshow");
});

if (document.body.classList.contains("home")) {
    injectSearchAndSettings();
}

/**
 */
function injectSearchAndSettings() {
    var nav = document.createElement("nav");
    nav.setAttribute("style", "max-width: 44em; margin: auto; text-align: right; overflow: hidden;");
    document.body.insertBefore(nav, document.body.firstChild);
    var a = nav.appendChild(document.createElement("a"));
    a.setAttribute("href", "/search");
    a.appendChild(document.createTextNode("search"));
    nav.appendChild(document.createTextNode(" | "));
    a = nav.appendChild(document.createElement("a"));
    a.setAttribute("href", "/settings");
    a.appendChild(document.createTextNode("settings"));

    var targetHeight = nav.offsetHeight;
    nav.style.height = "0";

    var timerId = window.setInterval(function() {
        var currentHeight = parseInt(nav.style.height);

        if (currentHeight >= targetHeight) {
            window.clearInterval(timerId);
        } else {
            nav.style.height = (currentHeight + 1) + "px";
        }
    }, 0);
}

})();

/*navigator.permissions.query({name:'geolocation'}).then(function(result) {
    console.log(result);
});

navigator.geolocation.getCurrentPosition(geoGood, geoBad);

function geoGood(pos) {
    console.log("success", pos);
}

function geoBad(err) {
    console.log(err);
}*/

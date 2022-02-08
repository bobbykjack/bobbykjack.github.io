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
//------------------------------------------------------------------------------
// json-ld.js 
//------------------------------------------------------------------------------

// load json-ld data file
var request = new XMLHttpRequest(),
    canon = document.querySelector("link[rel=canonical]"),
    path;

if (canon) {
    path = new URL(canon.getAttribute("href")).pathname;
    request.addEventListener("load", process_json_ld);

    if (path.substr(-1) == "/") {
        path += "/index.html";
    } else if (path.substr(-5) != ".html") {
        path += ".html";
    }

    request.open("GET", "/json-ld" + path + ".json");
    request.send();
}

/**
 * look up current page's canonical url in the map
 */
function process_json_ld() {
    if (this.status == 200) {
        var data = JSON.parse(this.responseText);
        inject_json_ld(data);
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
//------------------------------------------------------------------------------
// sort-table.js
//------------------------------------------------------------------------------

(function() {

/**
 * The following supports the sorting of the table by each column, by clicking
 * on the corresponding header.
 */
var table = document.querySelector("table.sortable");

if (table) {
    var headers = table.querySelectorAll("th"),
        index;

    for (index = 0; index < headers.length; index++) {
        var sel = "th:nth-of-type(" + (index + 1) + ")";

        if (table.querySelector(sel).classList.contains('nosort')) {
            continue;
        }

        headers[index].innerHTML =
            "<a href='" + window.location.origin + window.location.pathname
                + "?sort=" + (index + 1) + "'>" + headers[index].innerText
                + "</a>";
    }

    table.addEventListener("click", function(ev) {
        var index,
            url = new URL(window.location);

        if (ev.target.parentNode.parentNode.parentNode.tagName == 'THEAD') {
            ev.preventDefault();
            index = siblingIndex(ev.target.parentNode);
            sortRows(table, index);
            url.searchParams.set("sort", index);
            history.replaceState(null, "", url);
        }
    });

    window.addEventListener("load", function(ev) {
        var sort,
            url = new URL(window.location);

        if (sort = url.searchParams.get("sort")) {
            sortRows(table, parseInt(sort));
        }
    });
}

/**
 */
function siblingIndex(node) {
    var count = 0;

    while (node.previousElementSibling) {
        count++;
        node = node.previousElementSibling;
    }

    return count;
}

/**
 */
function sortRows(table, columnIndex) {
    var rows = table.querySelectorAll("tbody tr"),
        index,
        node,
        values = [],
        sel = "thead th:nth-child(" + (columnIndex + 1) + ")",
        sel2 = "td:nth-child(" + (columnIndex + 1) + ")",
        classList = table.querySelector(sel).classList,
        cls = "",
        allNum = true,
        val;

    if (classList) {
        if (classList.contains("date")) {
            cls = "date";
        } else if (classList.contains("number")) {
            cls = "number";
        }
    }

    for (index = 0; index < rows.length; index++) {
        node = rows[index].querySelector(sel2);
        val = node.innerText;

        if (node.childElementCount
            && node.firstElementChild.tagName == "PROGRESS"
        ) {
            var progressNode = node.firstElementChild;

            val = progressNode.getAttribute("value")
                / progressNode.getAttribute("max");
        } else if (isNaN(val)) {
            allNum = false;
        } else {
            val = parseFloat(val);
        }
        
        values.push({ value: val, index: index });
    }

    if (cls == "" && allNum) {
        cls = "number";
    }

    if (cls == "number") {
        values.sort(sortNumberVal);
    } else if (cls == "date") {
        values.sort(sortDateVal);
    } else {
        values.sort(sortTextVal);
    }

    if (cls == "number" || (classList && classList.contains("sort-reverse"))) {
        values = values.reverse();
    }

    for (var idx = 0; idx < values.length; idx++) {
        table.querySelector("tbody").appendChild(rows[values[idx].index]);
    }
}

/**
 * from https://stackoverflow.com/a/1063027
 */
function sortNumberVal(a, b) {
    return sortNumber(a.value, b.value);
}

function sortNumber(a, b) {
    return a - b;
}

/**
 */
function sortDateVal(a, b) {
    var dateA = Date.parse(a.value),
        dateB = Date.parse(b.value);

    return sortNumber(dateB, dateA);
}

/**
 *
 */
function sortTextVal(a, b) {
    var textA = (a.value + "").toUpperCase();
    var textB = (b.value + "").toUpperCase();

    if (textA < textB) {
        return -1;
    }

    if (textA > textB) {
        return 1;
    }

    return 0;
}

})();

//------------------------------------------------------------------------------
// stats.js 
//------------------------------------------------------------------------------

var default_stats = '{ "version": 1.0, "data": {} }',
    stats = JSON.parse(localStorage.getItem("stats") || default_stats),
    node = document.querySelector("#clear-storage"),
    canon = document.querySelector("link[rel=canonical]"),
    path,
    title;

// add a version field, upgrade old format to this one
if (!stats.hasOwnProperty("version")) {
    stats = { "version": 1.0, "data": stats };
}

if (node) {
    node.addEventListener('click', function(event) {
        event.preventDefault();
        localStorage.clear();
        alert("localStorage cleared");
    });
}

node = document.querySelector("#stats-table");

if (node) {
    populateStatsTable(stats);
}

if (canon) {
    path = new URL(canon.getAttribute("href")).pathname;
} else {
    path = window.location.pathname;
}

if (stats.data[path]) {
    stats.data[path]["hits"]++;
} else {
    title = document.querySelector("title").textContent;

    stats.data[path] = {
        "hits": 1,
        "title": title
    };
}

stats.data[path]["last"] = Date.now();

localStorage.setItem("stats", JSON.stringify(stats));

window.addEventListener('unload', function(event) {
// record the time spent on this page
});

/**
 */
function populateStatsTable(stats) {
    var tuples = [],
        table = document.createElement("table"),
        thead = document.createElement("thead"),
        tbody = document.createElement("tbody"),
        tr = document.createElement("tr"),
        th = document.createElement("th"),
        td,
        key,
        i,
        value,
        a;

    for (key in stats.data) {
        tuples.push([key, stats.data[key]["hits"]]);
    }

    tuples.sort(function(a, b) { return a - b; });

    table.setAttribute("border", "1");
    table.setAttribute("style", "width: 100%;");
    table.setAttribute("class", "sortable");

    node.appendChild(table);

    table.appendChild(thead);
    table.appendChild(tbody);
    thead.appendChild(tr);

    var columns = [ "Page", "Title", "Views", "Last Accessed" ],
        name;

    for (var i in columns) {
        name = columns[i];
        tr.appendChild(th = document.createElement("th"));

        if (name == "Last Accessed") {
            th.setAttribute("class", "date");
        }

        th.appendChild(document.createTextNode(name));
    }

    for (i = 0; i < tuples.length; i++) {
        key = tuples[i][0];
        value = tuples[i][1];

        tr = document.createElement("tr");
        tbody.appendChild(tr);

        td = document.createElement("td");
        tr.appendChild(td);
        a = document.createElement("a");
        a.appendChild(document.createTextNode(key));
        a.setAttribute("href", key);
        td.appendChild(a);

        td = document.createElement("td");
        tr.appendChild(td);
        td.appendChild(document.createTextNode(stats.data[key].title));

        td = document.createElement("td");
        tr.appendChild(td);
        td.appendChild(document.createTextNode(value));

        td = document.createElement("td");
        tr.appendChild(td);

        var lastAccess = new Date(stats.data[key].last);

        lastAccess = date_format(lastAccess);
        td.appendChild(document.createTextNode(lastAccess));
    }
}

/**
 */
function date_format(date) {
    var year = date.getFullYear(),
        month = date.getMonth() + 1,
        day = date.getDate();

    if (day < 10) {
        day = "0" + day;
    }

    if (month < 10) {
        month = "0" + month;
    }

    return year + '-' + month + '-' + day + ' ' + date.toLocaleTimeString();
}

//------------------------------------------------------------------------------
// table-groups.js 
//------------------------------------------------------------------------------

// Split table switch-progress into seperate tables, each representing a
// different status. Statuses are: Finished (col2 non empty) and Completed
// (col3 non empty). Completed should take precedence.

(function() {

return;

var statuses_foo = [{
    name: "Completed",
    column: 3,
    op: "non-empty"
},{
    name: "Finished",
    column: 2,
    op: "non-empty"
},{
    name: "Other"
}];

var status, status_index, table;
var tables = [];

var table_og = document.querySelector("table.sortable");
var table_og_body = table_og.querySelector("tbody");

var first = table_og_body.firstElementChild;

var rows = table_og.querySelectorAll("tbody tr");

statuses_foo.forEach(function(status) {
    status.row = document.createElement("tr");
    var td = document.createElement("th");
    td.appendChild(document.createTextNode(status.name));
    status.row.classList.add("added");
    td.setAttribute("colspan", 6);
    status.row.appendChild(td);
    table_og_body.insertBefore(status.row, first);
});

rows.forEach(function(row) {
    //console.log(row.querySelector("td:nth-child(2)"));

    if (row.querySelector("td:nth-child(2)").textContent == "") {
        console.log(row);
    }
});

console.log(statuses_foo);

})();


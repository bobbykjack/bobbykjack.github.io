var default_stats_old = '{ "hits": {}, "pages": {} }',
    default_stats = '{}',
    stats = JSON.parse(localStorage.getItem("stats") || default_stats),
    node = document.querySelector("#clear-storage"),
    canon = document.querySelector("link[rel=canonical]"),
    path,
    title;

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

if (stats[path]) {
    stats[path]["hits"]++;
} else {
    title = document.querySelector("title").textContent;

    stats[path] = {
        "hits": 1,
        "title": title
    };
}

stats[path]["last"] = Date.now();

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

    for (key in stats) {
        tuples.push([key, stats[key]["hits"]]);
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
        td.appendChild(document.createTextNode(stats[key].title));

        td = document.createElement("td");
        tr.appendChild(td);
        td.appendChild(document.createTextNode(value));

        td = document.createElement("td");
        tr.appendChild(td);

        var lastAccess = new Date(stats[key].last);
        lastAccess = lastAccess.toLocaleDateString() + ' ' + lastAccess.toLocaleTimeString();
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


var tables = document.querySelectorAll("table.groupable");

tables.forEach(function (table, i) {
    table.objs = extract_data(table);
    add_links_to_headers(table, i);
    setup_table_events(table);
});

// Document this function
// Explain what it does
// Do the right thing
function add_links_to_headers(table, i) {
    var ths = table.querySelectorAll("th"),
        loc = window.location,
        base = loc.origin + loc.pathname + "?group" + i + "=",
        sel;

    for (i = 0; i < ths.length; i++) {
        sel = `th:nth-of-type(${i + 1})`;

        if (table.querySelector(sel).classList.contains("group")) {
            ths[i].innerHTML = `<a href="${base}${i}">${ths[i].innerText}</a>`;
        }
    }
}

// Document this function
// Explain what it does
// Do the right thing
function setup_table_events(table) {
    table.addEventListener("click", function (ev) {
        var table_num = siblingIndex(this);

        var index,
            url = new URL(window.location);

        if (ev.target.parentNode.parentNode.parentNode.tagName == "THEAD") {
            ev.preventDefault();
            index = siblingIndex(ev.target.parentNode);

            group_table(table, ev.target.innerText);
            url.searchParams.set("group" + table_num, index);
            //history.replaceState(null, "", url);
            history.pushState(null, "", url);
        }
    });
}

// Document this function
// Explain what it does
// Do the right thing
window.addEventListener("load", function (ev) {
    var url = new URL(window.location);
    //console.log("window load", window.location.href);

    url.searchParams.forEach(function (val, key) {
        if (key.startsWith("group")) {
            var table_num = key.substr(5);
            var table = document.querySelectorAll("table")[table_num];

            if (table) {
                val++;
                var sel = `th:nth-child(${val})`;
                group_table(table, table.querySelector(sel).innerText);
            }
        }
    });
});

window.addEventListener("popstate", (event) => {
    var url = new URL(window.location);

    // iterate through each table
    var tables = document.querySelectorAll("table.groupable");

    tables.forEach(function (table, n) {
        var val;

        if (url.searchParams.has("group" + n)) {
            val = parseInt(url.searchParams.get("group" + n)) + 1;
            console.log("group table", n, "by column", val);

            var sel = `th:nth-child(${val})`;
            console.log(sel);
            group_table(table, table.querySelector(sel).innerText);
        } else {
            console.log("ungroup table", n);
            ungroup_table(table);
        }
    });
});

// Document this function
// Explain what it does
// Do the right thing
function siblingIndex(node) {
    var count = 0;
    var type = node.tagName;

    while (node.previousElementSibling) {
        node = node.previousElementSibling;
        if (node.tagName === type) count++;
    }

    return count;
}

// Extract data from a table, convert it into an array of objects
function extract_data(table) {
    var columns = table.querySelectorAll("thead th");
    var cols = [];

    columns.forEach(function (col) {
        cols.push(col.innerText);
    });

    var objs = [];
    var rows = table.querySelectorAll("tbody tr");

    rows.forEach(function (row) {
        var obj = {};

        row.querySelectorAll("td").forEach(function (cell, idxc) {
            obj[cols[idxc]] = cell.innerText;
        });

        objs.push(obj);
    });

    return objs;
}

// Group the array and generate a new table representing the groupings
function group_table(table, group_var) {
    var grouped = Object.groupBy(table.objs, function (el) {
        return el[group_var];
    });

    // Delete contents of tbody
    var tbody = table.querySelector("tbody");
    tbody.innerHTML = "";

    var sort_func;

    if (group_var == "Colour") {
        //console.log("here");
        sort_func = sort_color;
    }

    // Regenerate contents of table
    Object.keys(grouped)
        .sort(sort_func)
        .forEach(function (gkey) {
            grouped[gkey].forEach(function (obj, idx) {
                tr = make_el(tbody, "tr");

                Object.keys(obj).forEach(function (key) {
                    var atts = {};

                    if (key === group_var) {
                        if (idx > 0) {
                            return;
                        }

                        atts.rowspan = grouped[gkey].length;
                    }

                    make_text(make_el(tr, "td", atts), obj[key]);
                });
            });
        });
}

// remove rowspan from cells
// insert cells with same value in same position on following rows
function ungroup_table(table) {
    table.querySelectorAll("td[rowspan]").forEach(function (td) {
        var rspan = parseInt(td.getAttribute("rowspan")),
            val = td.innerText,
            idx = siblingIndex(td) + 1,
            row = td.parentNode,
            i,
            cell;

        for (i = 1; i < rspan; i++) {
            row = row.nextElementSibling;
            cell = document.createElement("td");
            cell.appendChild(document.createTextNode(val));
            td.removeAttribute("rowspan");

            row.insertBefore(
                cell,
                row.querySelector("td:nth-child(" + idx + ")"),
            );
        }
    });
}

// https://developer.mozilla.org/en-US/docs/Web/CSS/named-color
function sort_color(a, b) {
    const order = [
        "black",
        "silver",
        "gray",
        "white",
        "maroon",
        "red",
        "purple",
        "fuchsia",
        "green",
        "lime",
        "olive",
        "yellow",
        "navy",
        "blue",
        "teal",
        "aqua",
    ];

    a = order.indexOf(a.toLowerCase());
    b = order.indexOf(b.toLowerCase());

    if (a === b) {
        return 0;
    }

    if (a === -1) {
        return -1;
    }

    if (b === -1) {
        return 1;
    }

    return a - b;
}

// Make an element and add it to given element
function make_el(parent, child, attrs) {
    if (typeof parent === "string") {
        parent = document.querySelector(parent);
    }

    var new_el = parent.appendChild(document.createElement(child));

    if (attrs) {
        Object.keys(attrs).forEach(function (key) {
            new_el.setAttribute(key, attrs[key]);
        });
    }

    return new_el;
}

// Make a text node and add it to given element
function make_text(parent, text) {
    parent.appendChild(document.createTextNode(text));
    return parent;
}

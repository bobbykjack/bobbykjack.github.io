/**
 * The following supports the sorting of the table by each column, by clicking
 * on the corresponding header.
 */
var table = document.getElementById("switch-purchases");
var headers = table.querySelectorAll("th");
var index;

for (index = 0; index < headers.length; index++) {
    headers[index].innerHTML = "<a href=''>" + headers[index].innerText + "</a>";
}

table.addEventListener("click", function(ev) {
    if (ev.target.parentNode.parentNode.parentNode.tagName == 'THEAD') {
        sortRows(table, siblingIndex(ev.target.parentNode));
        ev.preventDefault();
    }
});

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
    var rows = table.querySelectorAll("tbody tr");
    var valueMap = {};
    var index;
    var node;
    var sorted = {};
    var sortdir = true;

    for (index = 0; index < rows.length; index++) {
        node = rows[index].querySelector("td:nth-child(" + (columnIndex + 1) + ")");
        var val = node.innerText;
        var res;

        if (res = val.match(/([0-9]+)\.([0-9]+)/)) {
            val = res[1] + "." + res[2];
            sortdir = false;
        }

        while (valueMap.hasOwnProperty(val)) {
            val += "1";
        }

        valueMap[val] = index;
    }

    var valueKeys;

    if (sortdir) {
        valueKeys = Object.keys(valueMap).sort();

        if (columnIndex == 2) {
            valueKeys = valueKeys.reverse();
        }
    } else {
        valueKeys = Object.keys(valueMap).sort(sortNumber).reverse();
    }

    valueKeys.forEach(function(key) {
        sorted[key] = valueMap[key];
    });

    for (var key in sorted) {
        table.querySelector("tbody").appendChild(rows[sorted[key]]);
    }
}

/**
 * from https://stackoverflow.com/a/1063027
 */
function sortNumber(a, b) {
    return a - b;
}
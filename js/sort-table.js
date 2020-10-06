/**
 * The following supports the sorting of the table by each column, by clicking
 * on the corresponding header.
 */
var table = document.querySelector("table.sortable");

if (table) {
    var headers = table.querySelectorAll("th"),
        index;

    for (index = 0; index < headers.length; index++) {
        headers[index].innerHTML = "<a href=''>" + headers[index].innerText + "</a>";
    }

    table.addEventListener("click", function(ev) {
        if (ev.target.parentNode.parentNode.parentNode.tagName == 'THEAD') {
            sortRows(table, siblingIndex(ev.target.parentNode));
            ev.preventDefault();
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

        if (isNaN(val)) {
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
        values = values.reverse();
    } else if (cls == "date") {
        values.sort(sortDateVal);
    } else {
        values.sort(sortTextVal);
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

    return sortNumber(dateA, dateB);
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


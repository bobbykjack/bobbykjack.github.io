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


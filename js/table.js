//------------------------------------------------------------------------------
// table.js
//------------------------------------------------------------------------------

(function () {
    var tbl = document.getElementById("switch-progress"),
        formNode = document.createElement("form");
    (inputNode = document.createElement("input")),
        (params = new URLSearchParams(window.location.search));

    var rows, title, searchTitle;

    inputNode.setAttribute("type", "text");
    inputNode.setAttribute("name", "title");
    inputNode.setAttribute("autofocus", "1");
    inputNode.setAttribute("placeholder", "Search...");

    formNode.appendChild(inputNode);
    formNode.setAttribute("id", "search");

    tbl.parentNode.insertBefore(formNode, tbl);

    setupEvent(inputNode);

    if (params.has("title")) {
        var title = params.get("title");
        inputNode.setAttribute("value", title);
        searchTitle = title.toLowerCase();
        searchFor(searchTitle);
    }

    /**
     */
    function searchFor(text) {
        rows = tbl.querySelectorAll("tbody tr");

        for (var i = 0; i < rows.length; i++) {
            title =
                rows[i].firstElementChild.firstChild.textContent.toLowerCase();

            if (title.indexOf(text) === -1) {
                rows[i].style.display = "none";
            } else {
                rows[i].style.display = "";
            }
        }
    }

    /**
     */
    function setupEvent(node) {
        node.addEventListener("input", function (ev) {
            ev.preventDefault();
            searchFor(node.value.trim().toLowerCase());
        });
    }
})();

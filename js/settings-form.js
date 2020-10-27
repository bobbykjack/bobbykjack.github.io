var formElement = document.getElementById("settings");

formElement.addEventListener("submit", function(ev) {
    var node = document.querySelector("#settings [name='links']:checked");

    settings.data.links = node.getAttribute("value");
    localStorage.setItem("settings", JSON.stringify(settings));

    window.alert("saved");
    window.location.reload();
    ev.preventDefault();
});

formElement.querySelectorAll("input[name='links']").forEach(function(node) {
    if (settings.data.links == node.getAttribute("value")) {
        node.setAttribute("checked", "checked");
    } else {
        node.removeAttribute("checked");
    }
});

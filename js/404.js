// 404.js

var old = document.querySelector("article > p");
old.parentNode.removeChild(old);

var curr = new URL(window.location);

var request = new XMLHttpRequest();
request.addEventListener("load", process_sitemap);
request.open("GET", "/sitemap.xml");
request.send();

var article = document.querySelector("article");
var p = document.createElement("p");
var a;

p.setAttribute("style", "font-weight: bold");

var tt = document.createElement("tt");
tt.appendChild(document.createTextNode(curr));

p.appendChild(document.createTextNode("The page you’re looking for — "));
p.appendChild(tt);
p.appendChild(document.createTextNode(" — does not exist."));

article.appendChild(p);

var ref = document.referrer;
var text;

p = document.createElement("p");

if (ref) {
    ref = new URL(ref);

    if (ref.hostname == curr.hostname) {
        text = "It looks like you came here from a link on this site. I’m "
            + "terribly sorry about this; if you’d be so kind as to ";
        p.appendChild(document.createTextNode(text));

        var body = "Hi Bobby!\n\nI spotted a broken link on your site at the"
            + " following URL:\n\n" + ref + "\n\nIt was a link to:\n\n" + curr;

        p.appendChild(mailto_link(
            "bobbyjack@gmail.com",
            "Broken link on your site",
            body
        ));

        text = " which automatically includes these details, I’ll get on and "
            + "fix it right away!";
        p.appendChild(document.createTextNode(text));
    } else {
        text = "It looks like you came here from a page on another site, ";
        p.appendChild(document.createTextNode(text));

        a = document.createElement("a");
        a.setAttribute("href", ref);
        a.appendChild(document.createTextNode(ref));
        p.appendChild(a);

        text = ". Although I can’t fix their bad link myself, if you want to ";

        p.appendChild(document.createTextNode(text));

        var body = "Hi Bobby!\n\nI spotted a broken link to your site on the"
            + " following URL:\n\n" + ref + "\n\nIt was a link to:\n\n" + curr;

        p.appendChild(mailto_link(
            "bobbyjack@gmail.com",
            "Broken link on an external site",
            body
        ));

        text = " which automatically includes these details, I’ll try to "
            + "follow it up.";

        p.appendChild(document.createTextNode(text));
    }
} else {
    text = "It looks like you typed in the URL yourself, or your browser "
        + "didn’t pass on the location of the page you came from. Either way, "
        + "there’s not a lot we can do about this, but please "
        + "double-check your URL and feel free to try again.";

    p.appendChild(document.createTextNode(text));
}

article.appendChild(p);

/*
    <p><a href="mailto:bobbyjack@gmail.com?subject=Broken+link">email</a></p>
    <script>document.writeln("referrer: " + document.referrer);</script>
*/

/**
 */
function mailto_link(to, subject, body) {
    var a = document.createElement("a");

    var mail_href = "mailto:" + to + "?subject=" + encodeURIComponent(subject)
        + "&body=" + encodeURIComponent(body);

    a.setAttribute("href", mail_href);
    a.appendChild(document.createTextNode("send me an email"));

    return a;
}

/**
 * Process sitemap
 */
function process_sitemap() {
    var article = document.querySelector("article");
    var doc = this.responseXML;
    var urls = doc.querySelectorAll("urlset > url > loc");
    var text;
    var locs = [];

    for (var i = 0; i < urls.length; i++) {
        text = urls[i].textContent;

        locs[i] = {
            loc: text, curr: curr, dist: getEditDistance(text, curr + "")
        };
    }

    locs.sort(function(a, b) {
        return a.dist - b.dist;
    });

    locs = locs.filter(function(loc) { return loc.dist < 10; });

    if (locs.length) {
        var ul = document.createElement("ul");

        for (var i = 0; i < locs.length; i++) {
            var li = document.createElement("li");
            ul.appendChild(li);
            a = document.createElement("a");
            a.setAttribute("href", locs[i].loc);
            a.appendChild(document.createTextNode(locs[i].loc));
            li.appendChild(a);
        }

        var h2 = document.createElement("h2");
        h2.appendChild(document.createTextNode("Possible alternatives"));
        article.appendChild(h2);

        var p = document.createElement("p");

        var text = "The following pages have been identified as possible close"
            + " matches to the one you originally came for.";

        p.appendChild(document.createTextNode(text));

        article.appendChild(p);

        article.appendChild(ul);
    }
}
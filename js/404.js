//------------------------------------------------------------------------------
// 404.js
//------------------------------------------------------------------------------

var curr = new URL(window.location);

/**
 * Start by removing the static boilerplate text which we'll replace with
 * something more specific.
 */
var old = document.querySelector("article > p");
old.parentNode.removeChild(old);

/**
 * Inject text into the page to describe the cause of the problem and further
 * action that can be taken.
 */
diagnose_problem();

/**
 * Add the 'Possible Alternatives' section of links to pages that might be
 * what our reader was looking for.
 */
inject_alternatives();

/**
 * SUPPORTING FUNCTIONS
 */

/**
 * Inject text appropriate to one of three situations: a broken link on an
 * external site, a broken link on this site, or insufficient information.
 */
function diagnose_problem() {
    var article = document.querySelector("article"),
        p = document.createElement("p"),
        a,
        tt,
        ref,
        text,
        body;

    p.setAttribute("style", "font-weight: bold");

    tt = document.createElement("tt");
    tt.appendChild(document.createTextNode(curr));

    p.appendChild(document.createTextNode("The page you’re looking for — "));
    p.appendChild(tt);
    p.appendChild(document.createTextNode(" — does not exist."));

    article.appendChild(p);

    ref = document.referrer;
    text;

    p = document.createElement("p");

    if (ref) {
        ref = new URL(ref);

        if (ref.hostname == curr.hostname) {
            text =
                "It looks like you came here from a link on this site. I’m " +
                "terribly sorry about this; if you’d be so kind as to ";

            p.appendChild(document.createTextNode(text));

            body =
                "Hi Bobby!\n\nI spotted a broken link on your site at the " +
                "following URL:\n\n" +
                ref +
                "\n\nIt was a link to:\n\n" +
                curr;

            p.appendChild(
                mailto_link(
                    "bobbyjack@gmail.com",
                    "Broken link on your site",
                    body,
                ),
            );

            text =
                " which automatically includes these details, I’ll get on " +
                "and fix it right away!";

            p.appendChild(document.createTextNode(text));
        } else {
            text = "It looks like you came here from a page on another site, ";
            p.appendChild(document.createTextNode(text));

            a = document.createElement("a");
            a.setAttribute("href", ref);
            a.appendChild(document.createTextNode(ref));
            p.appendChild(a);

            text =
                ". Although I can’t fix their bad link myself, if you want " +
                "to ";

            p.appendChild(document.createTextNode(text));

            body =
                "Hi Bobby!\n\nI spotted a broken link to your site on the " +
                "following URL:\n\n" +
                ref +
                "\n\nIt was a link to:\n\n" +
                curr;

            p.appendChild(
                mailto_link(
                    "bobbyjack@gmail.com",
                    "Broken link on an external site",
                    body,
                ),
            );

            text =
                " which automatically includes these details, I’ll try to " +
                "follow it up.";

            p.appendChild(document.createTextNode(text));
        }
    } else {
        text =
            "It looks like you typed in the URL yourself, or your browser " +
            "didn’t pass on the location of the page you came from. Either " +
            "way, there’s not a lot we can do about this, but please " +
            "double-check your URL and feel free to try again.";

        p.appendChild(document.createTextNode(text));
    }

    article.appendChild(p);
}

/**
 * Generate an Element representing a hypertext link to an email address
 */
function mailto_link(to, subject, body) {
    var a = document.createElement("a"),
        mail_href =
            "mailto:" +
            to +
            "?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(body);

    a.setAttribute("href", mail_href);
    a.appendChild(document.createTextNode("send me an email"));
    return a;
}

/**
 * Load our sitemap and identify URLs which are similar to the one originally
 * requested
 */
function inject_alternatives() {
    var request = new XMLHttpRequest();
    request.addEventListener("load", process_sitemap);
    request.open("GET", "/sitemap.xml");
    request.send();
}

/**
 * Parse sitemap file and...
 *
 * TODO Get page titles from json file
 */
function process_sitemap() {
    var sitemap_doc = this.responseXML,
        article = document.querySelector("article"),
        urls = sitemap_doc.querySelectorAll("urlset > url > loc"),
        locs = [],
        text,
        i,
        ul,
        li,
        h2,
        p;

    for (i = 0; i < urls.length; i++) {
        //console.log(urls[i]);
        text = urls[i].textContent;
        var tmpurl = new URL(text);

        locs[i] = {
            loc: tmpurl.pathname,
            other: curr.pathname,
            dist: getEditDistance(tmpurl.pathname, curr.pathname),
        };
    }

    console.log(locs);

    locs.sort(function (a, b) {
        return a.dist - b.dist;
    });

    locs = locs.filter(function (loc) {
        return loc.dist < 10;
    });

    if (locs.length) {
        ul = document.createElement("ul");

        for (i = 0; i < locs.length; i++) {
            li = document.createElement("li");
            ul.appendChild(li);
            a = document.createElement("a");
            a.setAttribute("href", locs[i].loc);
            a.appendChild(document.createTextNode(locs[i].loc));
            li.appendChild(a);
        }

        h2 = document.createElement("h2");
        h2.appendChild(document.createTextNode("Possible alternatives"));
        article.appendChild(h2);
        p = document.createElement("p");

        text =
            "The following pages have been identified as possible close" +
            " matches to the one you originally came for.";

        p.appendChild(document.createTextNode(text));
        article.appendChild(p);
        article.appendChild(ul);
    }
}

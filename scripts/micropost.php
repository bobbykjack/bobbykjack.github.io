#!/usr/bin/env php
<?php
// Usage: micropost.php "This is my post" /tmp/image.png
//
// - adds a new file, commits, and pushes
// - sends to bluesky
//
// 1. input message in format "this is [a link](/for/example)." (see ___ for
//    full format)
//
// 2. convert message into plain text with 'annotations' for links, hashtags,
//    mentions, and some other style (e.g. italics and bold)
//
// 3. use message+annotations to:
//    a) generate a local HTML file and build related navigation files
//    b) send a 'push post' to bluesky
//    c) add micropost to feed

echo "\n";

$env = parse_args($argv);

// BASE should be the docroot in which to place generated files.
define("BASE", realpath(dirname(__FILE__) . "/.."));
define("NOW", time());
define("BSKY_HANDLE", "bobbyjack.me");
define("BSKY_BASE", "https://bsky.social/xrpc");

define(
    "BSKY_ENDPOINT_CREATE_SESSION",
    BSKY_BASE . "/com.atproto.server.createSession"
);

define(
    "BSKY_ENDPOINT_CREATE_RECORD",
    BSKY_BASE . "/com.atproto.repo.createRecord"
);

define("BSKY_ENDPOINT_UPLOAD_BLOB", BSKY_BASE . "/com.atproto.repo.uploadBlob");

define("BSKY_MAX_POST_LENGTH", 300);

date_default_timezone_set("Europe/London");

list($env["facets"], $env["plain_message"]) = get_facets($env["message"]);

if (strlen($env["plain_message"]) > BSKY_MAX_POST_LENGTH) {
    die("Error: message too long for bluesky");
}

// convert message+facets to html

$env["tags"] = tags_from_facets($env["facets"]);
$env["html"] = message_to_html($env["plain_message"], $env["facets"]);

if (1) {
    if (count($env["images"])) {
        $env["embeds"] = upload_bsky_images($env["images"]);
    }
}

if (1) {
    $env = handle_images($env);
}

function handle_images($env)
{
    $img_html = "";

    if (count($env["images"])) {
        $img_tpl = '<a href="%s"><figure><img src="%s" /></figure></a>';

        foreach ($env["images"] as $image) {
            if (str_starts_with(realpath($image), BASE . "/")) {
                $img_src = substr($image, strlen(BASE));
            } else {
                $img_src =
                    "/images/" . date("Y/m", NOW) . "/" . basename($image);
                $dest_file = BASE . $img_src;

                make_dir(dirname($dest_file));
                copy_file($image, $dest_file);
            }

            $img_html .= sprintf($img_tpl, $img_src, $img_src);
        }
    }

    $env["html"] = $img_html . $env["html"];

    return $env;
}

if (1) {
    $env["url"] = add_page($env);
}

//echo "\nprocessing tags:\n";

if (0) {
    foreach ($env["tags"] as $tag) {
        add_to_tag_page($tag, $env);
    }
}

if (0) {
    if (add_to_nav($env) === false) {
        die("Problem writing to nav file");
    }
}

if (1) {
    send_bsky($env["plain_message"], $env["facets"], $env["embeds"]);
}

die("!!!\n");

//
function message_to_html($message, $facets)
{
    $html = "";
    $f = 0;

    for ($c = 0; $c < strlen($message); $c++) {
        if ($f < count($facets) && $facets[$f]["start"] == $c) {
            $start = $facets[$f]["start"];
            $len = $facets[$f]["end"] - $start;
            $type = $facets[$f]["type"];
            $value = $facets[$f]["value"];

            if ($type == "link" || $type == "tag") {
                $href =
                    ["link" => "", "tag" => "/micropost/tag/"][$type] . $value;
            }

            /*switch ($facets[$f]["type"]) {
                case "link":
                    $href = $facets[$f]["value"];
                    break;

                case "tag":
                    $href = "/micropost/tag/" . $facets[$f]["value"];
                    break;
            }*/

            $html .=
                '<a href="' .
                $href .
                '">' .
                substr($message, $start, $len) .
                "</a>";
            $c += $len - 1;
            $f++;
        } else {
            $html .= $message[$c];
        }
    }

    return $html;
}

//
function tags_from_facets($facets)
{
    $tags = [];

    foreach ($facets as $facet) {
        if ($facet["type"] == "tag") {
            $tags[] = $facet["value"];
        }
    }

    return $tags;
}

// Usage: micropost message [file]
function parse_args($args)
{
    $env = [
        "images" => [],
        "embeds" => [],
    ];

    if (count($args) < 2) {
        die("Usage: micropost message [file]\n");
    }

    $env["message"] = $args[1];

    if (count($args) > 2) {
        for ($n = 2; $n < count($args); $n++) {
            $env["images"][] = $args[$n];
            echo $args[$n] . " " . mime_content_type($args[$n]) . "\n";
        }
    }

    return $env;
}

// Look for [](), #, and @
//
// This should convert a md-formatted string into an array of facets
// representing links (mentions? hashtags?)
function get_facets($message)
{
    $facets = [];
    $mode = "text";
    $buffer = "";
    $text = "";
    $out = "";
    $debug = false;

    for ($c = 0; $c < strlen($message); $c++) {
        if ($debug) {
            echo $c . " [$mode]\n";
        }

        $ch = $message[$c];

        if ($mode == "link") {
            if ($ch == "]") {
                if ($c == strlen($message) - 1) {
                    $facets[] = [
                        "type" => "link",
                        "value" => $buffer,
                        "start" => strlen($out),
                        "end" => strlen($out . $buffer),
                    ];
                    $out .= $buffer;
                    //$buffer = '';
                } else {
                    switch ($message[++$c]) {
                        case "(":
                            $mode = "url";
                            $text = $buffer;
                            //$buffer = "";
                            break;

                        default:
                            // [url]
                            $facets[] = [
                                "type" => "link",
                                "value" => $buffer,
                                "start" => strlen($out),
                                "end" => strlen($out . $buffer),
                            ];
                            $out .= $buffer;
                            $mode = "text";
                            $c--;
                            break;
                    }
                }

                $buffer = "";
            } else {
                $buffer .= $ch;
            }
        } elseif ($mode == "url") {
            if ($ch == ")") {
                $facets[] = [
                    "type" => "link",
                    "value" => $buffer,
                    "start" => strlen($out),
                    "end" => strlen($out . $text),
                ];
                $out .= $text;
                $mode = "text";
            } else {
                $buffer .= $ch;
            }
        } elseif ($mode == "text") {
            if ($ch == "[") {
                if ($debug) {
                    echo "found open bracket\n";
                }
                $mode = "link";
                $buffer = "";
            } elseif ($ch == "#") {
                //echo "found hashtag\n";
                $mode = "tag";
            } else {
                $out .= $ch;
            }
        } elseif ($mode == "tag") {
            // TODO work out what else can end a tag
            if ($ch == " ") {
                $facets[] = [
                    "type" => "tag",
                    "value" => $buffer,
                    "start" => strlen($out),
                    "end" => strlen($out . $buffer),
                ];

                $out .= $buffer . " ";
                $buffer = "";
                $mode = "text";
            } else {
                $buffer .= $ch;
            }
        }
    }

    // clean up at the end of the string
    if ($mode == "tag") {
        $facets[] = [
            "type" => "tag",
            "value" => $buffer,
            "start" => strlen($out),
            "end" => strlen($out . $buffer),
        ];
        $out .= $buffer;
    }

    return [$facets, $out];
}

//
function add_link_facet($start, $end, $url)
{
    return [
        "index" => ["byteStart" => $start, "byteEnd" => $end],
        "features" => [
            [
                '$type' => "app.bsky.richtext.facet#link",
                "uri" => $url,
            ],
        ],
    ];
}

//
function add_tag_facet($start, $tag)
{
    return [
        "index" => ["byteStart" => $start, "byteEnd" => $start + strlen($tag)],
        "features" => [
            [
                '$type' => "app.bsky.richtext.facet#tag",
                "tag" => $tag,
            ],
        ],
    ];
}

//
function upload_bsky_images($images)
{
    $embeds = [
        '$type' => "app.bsky.embed.images",
        "images" => [],
    ];

    foreach ($images as $image_file) {
        $img_bytes = get_image_bytes($image_file);
        $mime_type = mime_content_type($image_file);

        // TODO determine mime type from file
        $blob = bsky_request(
            BSKY_HANDLE,
            BSKY_ENDPOINT_UPLOAD_BLOB,
            $mime_type,
            //"image/jpeg",
            $img_bytes
        );

        $embeds["images"][] = ["alt" => "", "image" => $blob["blob"]];
    }

    return $embeds;
}

function get_image_bytes($file)
{
    if (($len = filesize($file)) === false) {
        die("bad1");
    }

    if ($len > 1000000) {
        die("bad 1.5");
    }

    echo "image is [$len] bytes\n";

    if (($fp = fopen($file, "rb")) === false) {
        die("bad2");
    }

    if (($img_bytes = fread($fp, $len)) === false) {
        die("bad3");
    }

    if (($res = fclose($fp)) === false) {
        die("bad4");
    }

    return $img_bytes;
}

function bsky_request($handle, $url, $ct, $payload)
{
    echo "sending bluesky request to [$url]\n";
    $token = bsky_api_token();

    $payload_opts = [];

    $opts = [
        CURLOPT_URL => $url,
        CURLOPT_HTTPHEADER => [
            "Content-Type: $ct",
            "Authorization: Bearer $token",
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
    ];

    $ch = curl_init();
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    curl_close($ch);
    //echo "[$res]\n";
    return json_decode($res, true);
}

// ... plaintext
/*
function strip_message($message)
{
    // remove links
    $message = preg_replace("/\[([^\]]+)\]\(([^\)]+)\)/", '$1', $message);
    return $message;
}
*/

// Add micropost page (/micropost/${y/m/d/H-i}.html)
function add_page($env)
{
    $path = "/micropost/" . date("Y/m/d/H-i", NOW) . ".html";
    $file = BASE . $path;
    //echo "[$file]\n";

    $date1 = date("Y-m-d H:i", NOW);
    $date2 = date("l jS F, Y @ H:i", NOW);

    $html = '<time datetime="' . $date1 . '">' . $date2 . "</time>";

    $html .= "<p>" . $env["html"] . "</p>";

    $res = make_dir(dirname($file));

    // copy source template from somewhere and inject message into it
    $contents = file_get_contents(BASE . "/tpl/micropost.html");
    $canon = "https://bobbyjack.me" . substr($path, 0, -5);

    $reps = [
        [
            '<link rel="canonical" href="https://bobbyjack.me/" />',
            '<link rel="canonical" href="' . $canon . '" />',
        ],
        ["<main></main>", "<main>" . $html . "</main>"],
        [
            '<meta name="twitter:title" content="" />',
            '<meta name="twitter:title" content="' .
            $env["plain_message"] .
            '" />',
        ],
        [
            '<meta name="twitter:description" content="" />',
            '<meta name="twitter:description" content="' .
            $env["plain_message"] .
            '" />',
        ],
        [
            '<meta name="description" content="" />',
            '<meta name="description" content="' .
            $env["plain_message"] .
            '" />',
        ],
    ];

    foreach ($reps as $rep) {
        $contents = str_replace($rep[0], $rep[1], $contents);
    }

    write_file($file, $contents);
    return $path;
}

//
function send_bsky($message, $facets, $embeds)
{
    $token = bsky_api_token();

    $record = [
        "text" => $message,
        "createdAt" => date("c"),
    ];

    if (count($embeds)) {
        $record["embed"] = $embeds;
    }

    if (count($facets)) {
        $record["facets"] = [];

        /*
        "index" => ["byteStart" => $start, "byteEnd" => $end],
        "features" => [
            [
                '$type' => "app.bsky.richtext.facet#link",
                "uri" => $url,
            ],
        ],
        */

        foreach ($facets as $facet) {
            if ($facet["type"] == "tag") {
                $record["facets"][] = [
                    "index" => [
                        "byteStart" => $facet["start"],
                        "byteEnd" => $facet["end"],
                    ],
                    "features" => [
                        [
                            '$type' => "app.bsky.richtext.facet#tag",
                            "tag" => $facet["value"],
                        ],
                    ],
                ];
            }
        }
    }

    $payload = json_encode([
        "repo" => BSKY_HANDLE,
        "collection" => "app.bsky.feed.post",
        "record" => $record,
    ]);

    echo $payload . "\n";

    $res = bsky_request(
        BSKY_HANDLE,
        BSKY_ENDPOINT_CREATE_RECORD,
        "application/json",
        $payload
    );

    echo print_r($res, true) . "\n";

    $opts = [
        CURLOPT_URL => "https://bsky.social/xrpc/com.atproto.repo.createRecord",
        CURLOPT_HTTPHEADER => [
            "Content-Type: application/json",
            "Authorization: Bearer $token",
        ],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
    ];

    $ch = curl_init();
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    curl_close($ch);
    echo "[$res]\n";
}

function bsky_api_token()
{
    $handle = "bobbyjack.me";
    $password = "d0694a6ead68ca13989c21be084d6cea";
    $payload = json_encode(["identifier" => $handle, "password" => $password]);

    $opts = [
        CURLOPT_URL => "https://bsky.social/xrpc/com.atproto.server.createSession",
        CURLOPT_HTTPHEADER => ["Content-Type:application/json"],
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => $payload,
        CURLOPT_RETURNTRANSFER => true,
    ];

    $ch = curl_init();
    curl_setopt_array($ch, $opts);
    $res = curl_exec($ch);
    curl_close($ch);

    $data = json_decode($res, true);
    return $data["accessJwt"];
}

//
function add_to_tag_page($tag, $env)
{
    $url = $env["url"];
    $target = BASE . "/micropost/tag/" . $tag . ".html";

    if (file_exists($target)) {
        $src = $target;
    } else {
        $src = BASE . "/tpl/micropost-tag.html";
    }

    $contents = file_get_contents($src);

    make_dir(dirname($target));

    $new_post = '<li><a href="' . $url . '">' . $env["html"] . "</a></li>";

    $reps = [
        ["<h1></h1>", "<h1>" . $tag . "</h1>"],
        ['<ol class="posts">', '<ol class="posts">' . $new_post],
    ];

    foreach ($reps as $rep) {
        $contents = str_replace($rep[0], $rep[1], $contents);
    }

    return write_file($target, $contents);
}

//
function make_dir($dir)
{
    $res = 0;

    if (!is_dir($dir)) {
        $res = mkdir($dir, 0777, true);
        echo "Made directory [$dir] with result [$res]\n";
    }

    return $res;
}

//
function copy_file($src, $dest)
{
    $res = copy($src, $dest);
    echo "Copied [$src] to [$dest] with result [$res]\n";
    return $res;
}

// files should only be written to the docroot, so check...
function write_file($file, $contents)
{
    $path = realpath(dirname($file));
    echo "write_file [$file] [$path]\n";

    if (!str_starts_with($path, BASE . "/")) {
        die(
            "Trying to write to file in [$path] outside of docroot/base [" .
                BASE .
                "]\n"
        );
    }

    $res = file_put_contents($file, $contents);
    echo "Written to file [$file] with result [$res]\n";

    return $res;
}

// Page at /micropost/index.html should show most recent n posts
// Pages at /micropost/page/1.html, /2.html, etc. should show archive
function add_to_nav($env)
{
    // load index page from template or filesystem
    // add new post to beginning of list
    // if list has more than n items, remove last
    $target = BASE . "/micropost/index.html";

    if (file_exists($target)) {
        $src = $target;
    } else {
        $src = BASE . "/tpl/micropost-nav.html";
    }

    $contents = file_get_contents($src);

    make_dir(dirname($target));

    $new_post =
        '<li><a href="' . $env["url"] . '">' . $env["html"] . "</a></li>";

    $reps = [['<ol class="posts">', '<ol class="posts">' . $new_post]];

    foreach ($reps as $rep) {
        $contents = str_replace($rep[0], $rep[1], $contents);
    }

    $res = write_file($target, $contents);
    return $res;

    // get most recent page from /page/ dir
    // if most recent page has m items, create a new page from template and add new post to it
    // otherwise, add new post to end of list
}


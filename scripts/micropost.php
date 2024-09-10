<?php
// micropost.php "This is my post"
// - adds a new file, commits, and pushes
// - sends to bluesky
//

if (count($argv) < 2) {
    die("Usage: micropost message [file]\n");
}

$message = $argv[1];

$images = [];

if (count($argv) > 2) {
    for ($n = 2; $n < count($argv); $n++) {
        $images[] = $argv[$n];
        echo $argv[$n] . " " . mime_content_type($argv[$n]) . "\n";
    }
}

echo "message [$message]\n";
print_r($images);
die("done\n");

define("BASE", dirname(__FILE__) . "/..");
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

date_default_timezone_set("Europe/London");

//$message = "This is a [message](https://bobbyjack.me/).";

$facets = get_facets($message);
$embeds = [];

if (count($images)) {
    $embeds = upload_bsky_images($images);
}

//add_page($message);
send_bsky($message, $facets, $embeds);

// look for [](), #, and @
function get_facets($message)
{
    $facets = [];

    if (0) {
        $facets[] = [
            "index" => ["byteStart" => 109, "byteEnd" => 115],
            "features" => [
                [
                    '$type' => "app.bsky.richtext.facet#link",
                    "uri" => "https://bobbyjack.me/",
                ],
            ],
        ];
    }

    return $facets;
}

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

// Just handling links for now.
function markdown_to_html($md)
{
    $md = preg_replace(
        "/\[([^\]]+)\]\(([^\)]+)\)/",
        '<a href="$2">$1</a>',
        $md
    );

    $date1 = date("Y-m-d H:i", NOW);
    $date2 = date("l jS F, Y @ H:i", NOW);

    return '<time datetime="' .
        $date1 .
        '">' .
        $date2 .
        "</time><p>" .
        $md .
        "</p>";
}

// This should convert a md-formatted string into an array of facets representing links (mentions? hashtags?)
function markdown_to_bsky($md)
{
}

// ... plaintext
function strip_message($message)
{
    // remove links
    $message = preg_replace("/\[([^\]]+)\]\(([^\)]+)\)/", '$1', $message);

    return $message;
}

function add_page($message)
{
    $path = date("/Y/m/d/H-i", NOW) . ".html";
    $file = BASE . $path;
    echo "[$file]\n";

    $html = markdown_to_html($message);
    $stripped = strip_message($message);

    if (!is_dir($dir = dirname($file))) {
        $res = mkdir($dir, 0777, true);
        echo "mkdir [$res]\n";
    }

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
            '<meta name="twitter:title" content="' . $stripped . '" />',
        ],
        [
            '<meta name="twitter:description" content="" />',
            '<meta name="twitter:description" content="' . $stripped . '" />',
        ],
        [
            '<meta name="description" content="" />',
            '<meta name="description" content="' . $stripped . '" />',
        ],
    ];

    foreach ($reps as $rep) {
        $contents = str_replace($rep[0], $rep[1], $contents);
    }

    $res = file_put_contents($file, $contents);
    echo "file_put_contents [$res]\n";
}

function send_bsky($message, $facets, $embeds)
{
    $token = bsky_api_token();

    //$handle = "bobbyjack.me";

    /*
    $payload = json_encode([
        "repo" => $handle,
        "collection" => "app.bsky.feed.post",
        "record" => [
            "text" => "Hello world! I posted this via the API.",
            "createdAt" => date("c"),
        ],
    ]);
    */

    $record = [
        "text" => $message,
        "createdAt" => date("c"),
    ];

    if (count($embeds)) {
        $record["embed"] = $embeds;
    }

    if (count($facets)) {
        $record["facets"] = $facets;
    }

    $payload = json_encode([
        "repo" => BSKY_HANDLE,
        "collection" => "app.bsky.feed.post",
        "record" => [
            "text" => $message,
            "createdAt" => date("c"),
        ],
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

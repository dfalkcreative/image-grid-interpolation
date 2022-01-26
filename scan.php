<?php

$path = 'images';

// Verify that the input directory exists.
if(!file_exists($path) || !is_dir($path)){
    echo "The './$path' path either doesn't exist or is not a directory.";
    exit();
}

// Determine all available images and write to an output JSON file.
$files = fopen('images.json', 'w');
fwrite($files, json_encode(array_values(preg_grep('~\.(jpeg|jpg|png)$~', scandir($path)))));
fclose($files);

echo 'Complete!';
exit();
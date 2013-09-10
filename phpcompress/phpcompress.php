<?php
require 'compressLib.php';

if ( $_SERVER['argc'] < 4) {
    echo  "php compress  need param 1(filepath)";
    exit(1);
}

$file = $_SERVER['argv'][1];
$outputfile = $_SERVER['argv'][2];
$type = 2;
switch ($_SERVER['argv'][3]){
    case "c1":
        $type = 2;
        break;
}
if (!is_file($file)) {
    echo "php compress , file is not exist.";
    exit(1);
}
$r = file_get_contents($file);

//echo "input = ".$file."\n";
//echo "output = ".$outputfile."\n";
$ck=array(
2 // php 部分 0全壓 1只壓func 2都不壓
,1
,0
,0
,0
,0
,1 //用空白打亂
);
$phpCom=new php_compress();
$phpCom->setting($ck);
$data=$phpCom->compress($r);
file_put_contents($outputfile,$data);


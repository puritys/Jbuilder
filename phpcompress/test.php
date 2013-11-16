<?php
require "compressLib.php";

class phpCompressTest extends PHPUnit_Framework_TestCase
{

}
$ck=array(
2 // php 部分 0全壓 1只壓func 2都不壓
,1
,0
,0
,0
,0
,1 //用空白打亂
);

$str = <<<PHP
<?php
\$a = 10;
   perfUtil::rm("title");

echo \$a;
   perfUtil::rm("title");

PHP;
$phpCom=new php_compress();
$phpCom->setting($ck);

$data = $phpCom->compress($str);
echo $data;

//file_put_contents($outputfile,$data);


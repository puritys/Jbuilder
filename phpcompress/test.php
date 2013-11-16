<?php
require "compressLib.php";

class phpCompressTest extends PHPUnit_Framework_TestCase
{
    protected function setUp()
    {
        $this->ck = array(
        2 // php 部分 0全壓 1只壓func 2都不壓
        ,1
        ,0
        ,0
        ,0
        ,0
        ,1 //用空白打亂
        );

    }

    public function testRemovePerf() 
    {
        $ck = $this->ck;
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
        if (preg_match('/perf/', $data)) {
            $this->assertTrue(false);
        } else {
            $this->assertTrue(true);

        }
    }

}




#!/usr/local/bin/node
var conf = require("config.sjs");
require(conf.SP_library+"/basic/basic_function.sjs");
require("./rpmbuild_lib.sjs");
//var _process = require("process").Process;
var RPM_TMP = "/tmp/rpm_tmp";
exec("sudo rm -rf " + RPM_TMP);
//removeDir(RPM_TMP, true);
mkdir(RPM_TMP);
mkdir(RPM_TMP+"/BUILD");
mkdir(RPM_TMP+"/SOURCES");
mkdir(RPM_TMP+"/RPMS");
mkdir(RPM_TMP+"/SPECS");

var pkgPath = process.argv[2];

var pkg_content = file_get_contents(pkgPath);
var env = process.env;
var c = parsePKGConf(pkg_content, env);

c.confParam['_topdir']=RPM_TMP;
removeDir("/tmp/"+c.confParam['NAME']+"-buildroot", true); //remove tmp file for install
fileEncode(c);  //start encode

var specData = genSpec(c.confParam, c.pkgFile);
var spec = RPM_TMP+"/SPECS/"+c.confParam.NAME+".spec";
file_put_contents(spec, specData);


//change pwd and run rpmbuild
var cmd = "cd "+RPM_TMP+"/SOURCES && tar -zcvf "+RPM_TMP+"/SOURCES/"+c.confParam.NAME+".tar.gz "+c.confParam.NAME+"-"+c.confParam.VERSION;

execSync(cmd);

var herePath = process.cwd();
var file = c.confParam.NAME+"-"+c.confParam.VERSION;
console.log("execute path:");
print_r(herePath);

cmd = "cd "+RPM_TMP+"/SOURCES && sudo rpmbuild -bb "+spec ; //+ " 2>&1";
print_r(cmd);
var s = execSync(cmd);
print_r(s);
cmd = "cd "+RPM_TMP+" && cp RPMS/i386/"+file+"*.rpm  "+herePath ; //+ " 2>&1";
print_r("cmd = "+ cmd);
var s2 = execSync(cmd);
print_r(s2);


#!/usr/local/bin/node
var conf = require("config.sjs");
require(conf.SP_library+"/basic/basic_function.sjs");
require("./rpmbuild_lib.sjs");
//var _process = require("process").Process;
var RPM_TMP = "/www/rpm_tmp"; //"/tmp/rpm_tmp";

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
if (!env.MYRPM) {
    env.MYRPM = "/www/devPKG";
}
var c = parsePKGConf(pkg_content, env);

c.confParam['_topdir']=RPM_TMP;
exec("sudo rm -rf " +  RPM_TMP + "/"+c.confParam['NAME']+"-buildroot"); //remove tmp file for install


fileEncode(c, RPM_TMP);  //start encode

var specData = genSpec(c.confParam, c.pkgFile, RPM_TMP);
var spec = RPM_TMP+"/SPECS/"+c.confParam.NAME+".spec";
file_put_contents(spec, specData);


//change pwd and run rpmbuild
var cmd = "cd "+RPM_TMP+"/SOURCES && tar -zcvf "+RPM_TMP+"/SOURCES/"+c.confParam.NAME+".tar.gz "+c.confParam.NAME+"-"+c.confParam.VERSION + " 2>&1";

execSync(cmd);

var herePath = process.cwd();
var file = c.confParam.NAME+"-"+c.confParam.VERSION;
console.log("execute path:");
print_r(herePath);

cmd = "cd "+RPM_TMP+"/SOURCES && sudo rpmbuild -bb "+spec + " --buildroot " + RPM_TMP +  "/" + c.confParam['NAME']+"-buildroot 2>&1";
print_r(cmd);
var s = execSync(cmd);
//print_r(s);
cmd = "find "+RPM_TMP+"/RPMS/ -name *.rpm | xargs -t -n 1 -I@ cp @  "+herePath + " ";
print_r("cmd = "+ cmd);
var s2 = execSync(cmd);
//print_r(s2);


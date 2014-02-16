var _File = require("fs").File;
var _Directory = require("fs").Directory;
//var _CSS = require("./css_compress.sjs").css_compress;
var encodeRPath = "";
global.parsePKGConf=function(pkg_content, env) {/*{{{*/
    var prefixPackage = "ps_";
    var line = pkg_content.split(/[\r\n]+/i);
    var n = line.length;
    var regline = /([^=]+)=([^=]+)/i,regRet,val;
    var confParam = {
                        "exec_after": [] //Exec command after install package
                    };//variable in pkg content 
    var pkgFile = {
                    "glob": [],
                    "file": []
                  };
    var command;
    for (var i=0; i<n; i++) {
        if(line[i].substr(0,1) == "#"){continue;}
        regRet = line[i].match(regline);
        var r = line[i].split(/ /);
        if (r.length < 5 && regRet && regRet.length == 3) {
            //set variable
            val = regRet[2];
            val = replaceVB(val, env, confParam);
            confParam[regRet[1]] = val;
        } else {
            line[i] = replaceVB(line[i], env, confParam);
            switch (r[0]) {
                case 'glob':
                    pkgFile.glob.push(line[i]);
                    break;
                case 'exec_after': case 'post':
                    command = line[i].split(/post[\s]*/)[1];
                    confParam.exec_after.push(command);
                    break;
            }

        }


    }
    confParam['NAME'] = prefixPackage + confParam['NAME'];
    //check required param
    var require_param = ["VERSION_FILE", "NAME"]//"ROOT"];
    for (i=require_param.length-1; i>=0 ; i--) {
        if (!confParam[require_param[i]]) {
            error_log("lost "+require_param[i]);
            print_r("lost "+require_param[i]);
            exit();
        }
    }

    //var versionFile = confParam["ROOT"]+"/pkg/"+confParam['VERSION_FILE'];
    var versionFile = confParam['VERSION_FILE'];

    var version = execSync("cat "+versionFile+" |grep version |awk -F \" \" '{print $2}' | head -n 1");
    if (!version) {
        print_r("version is empty");
        exit();
    }
    confParam["VERSION"] = version.replace(/[^\da-z\.\-]/,"");

    return {"confParam":confParam,"pkgFile":pkgFile};

}/*}}}*/


global.genSpec = function(conf, file, RPM_TMP) {/*{{{*/
    removeDir(RPM_TMP + "/"+conf['NAME']+"-buildroot");
    var data =[];
    data.push( "%define _topdir "+conf["_topdir"]);
    data.push( "%define Version "+conf["VERSION"]);
    data.push( "%define RPM_BUILD_ROOT _topdir");
    data.push( "%define Name "+conf['NAME']);
    data.push( "%define BuildRoot " + RPM_TMP + "/%{Name}-buildroot");
    data.push( "%define debug_package %{nil}");
    data.push( "Summary:        Just RPM Package");
    data.push( "Name:           %{Name}");
    data.push( "Version:        %{Version}");
    data.push( "Release:        1");
    data.push( "Vendor:         No <pipi00000@gmail.com>");
    data.push( "Packager:       Puritys <pipi00000@gmail.com>");
    data.push( "License:        GPL");
    data.push( "Group:          Develop");
    data.push( "Source :        "+conf["NAME"]+".tar.gz");
    data.push( "BuildRoot:      %{BuildRoot}");
    data.push( "%description");
    data.push( "其他相關說明");
    data.push( "%prep");
    data.push( "%setup -q");
    data.push( "%build");
    data.push( "%install");
    data.push( "#設定安裝的實際路徑與檔案");

    //create dir
    var glob = file.glob;
    var n = glob.length;
    var cp_command = "";
    var chmod_command = "";
    var dir_command = "";
    var chmod,group,owner;
    var cssSpriteEnable = false;
    var REG_param = /([a-z]+)="([^"]+)"/ig;
    var REG_param2 = /([a-z]+)="([^"]+)"/i;
    var installDir,installName;
    for (var i=0;i<n;i++) {
        var param = {};
        //get param
        var s = glob[i].match(REG_param);
        if(s && s.length){
            for (var j=0; j<s.length; j++) {
                var k = s[j].match(REG_param2);
                param[k[1]] = k[2];
            }
        }

        var re = glob[i].split(/[\s]+/);
        chmod = (re[1]!="-")?re[1]:"755";
        owner = (re[2]!="-")?re[2]:"root";
        group = (re[3]!="-")?re[3]:"root";
        installDir = re[4].replace(/[^\/]+$/, '');
        var tmpMatch = re[4].match(/([^\/]+)$/);
        installName = ""; //get install file name in conf
        if (tmpMatch && tmpMatch[1]) {
            installName = tmpMatch[1];
        }
        dir_command += "install -d %{BuildRoot}"+installDir+"\n";
        var installPath = re[4];
        var strr = re[4].lastIndexOf("\/");
        var dir = re[4].substr(0,strr);
        var sourceGlob = re[5];
        strr = dir.lastIndexOf("\/");
        dir = dir.substr(0,strr)+"/";
        strr = sourceGlob.lastIndexOf("\/");
        var g_star = sourceGlob.substring(strr+1 , sourceGlob.length);
        if(!checkInCPCommand()){
            var INS_path = re[4];//install path

            if (!g_star) {
                if (!INS_path.match(/\/$/)) {
                    //cp file
                    if (installName) {
                        //install file name is different
                        cp_command += "cp  "+encodeRPath+"/"+INS_path+" %{BuildRoot}"+INS_path+"\n";
                    } else {
                        cp_command += "cp -r "+encodeRPath+"/"+INS_path+g_star+" %{BuildRoot}"+INS_path+"\n";
                    }
                } else {
                    //cp dir
                    var k = sourceGlob.match(/([^\/]+)\/$/);
                    var save_path = INS_path;
                    INS_path = INS_path+k[1]+"/";
                    cp_command += "cp -r "+encodeRPath+"/"+INS_path+" %{BuildRoot}"+save_path+"\n";

                }
            } else {
                if (installName) {
                    //install file name is different
                    cp_command += "cp  "+encodeRPath+"/"+INS_path+" %{BuildRoot}"+INS_path+"\n";
                } else {

                    cp_command += "cp -r "+encodeRPath+"/"+INS_path+g_star+" %{BuildRoot}"+INS_path+"\n";
                }
            }
        }

        //set rpm spec install dir
        installDir = installDir.replace(/\/{2,}/,'');
        installDir = installDir.replace(/\/$/,'');
        if (installName) {
            chmod_command += "%attr("+chmod+","+owner+","+group+") "+installDir+"/"+installName+" \n";
        } else {
            chmod_command += "%attr("+chmod+","+owner+","+group+") "+installDir+"/"+g_star+" \n";
        }

        if (re[6] && re[6] == "css_sprite" && cssSpriteEnable == false){
            cssSpriteEnable = true;
            dir_command += "install -d %{BuildRoot}" + param.homePath + "/sprite\n";
            cp_command += "cp -r "+encodeRPath+"/"+param.homePath+"/sprite %{BuildRoot}"+param.homePath+"/"+"\n";
            chmod_command += "%attr("+chmod+","+owner+","+group+") "+param.homePath+"/sprite"+" \n";
           
        }
    }

    data.push( dir_command);

    //cp file
    data.push( cp_command);
    data.push( "%files");
    data.push( "#安裝時:設定預設的檔案權限");
    data.push( "%defattr(755,root,root)");
    data.push( "#安裝時:設定檔案的路徑");
    data.push( chmod_command);
    data.push( "%clean");
    data.push( "rm -rf %{BuildRoot}/");
    data.push( "%post");
    for (var index in conf.exec_after) {
        data.push( conf.exec_after[index]);
    }
    return data.join("\n");
}/*}}}*/

/*replace variable*/
function replaceVB(val, env, confParam) {/*{{{*/
    var regVb = /\$([a-z\d_]+)/ig;
    var regVal = val.match(regVb);
    for(pro in regVal) {
        var tx = regVal[pro].replace(/\$/,"");
        if (env[tx]) {
            val = val.replace(new RegExp("\\$"+tx), env[tx]);
        } else if(confParam[tx]){
            val = val.replace(new RegExp("\\$"+tx), confParam[tx]);
        }
    }
    return val;
}/*}}}*/

global.fileEncode = function (conf, RPM_TMP) {/*{{{*/
    var confParam = conf.confParam;
    var glob = conf.pkgFile['glob'];

    encodeRPath = RPM_TMP + "/SOURCES/"+confParam.NAME+"-"+confParam.VERSION; //encode root path
    mkdir(encodeRPath);
    var n = glob.length,re;
    var chmod = "444",owner="root",group="root";
    var inputFile="",outputFile="";
    var REG_param = /([a-z]+)="([^"]+)"/ig;
    var REG_param2 = /([a-z]+)="([^"]+)"/i;
    var encodeType = "", sourceGlob = "";
    for (var i =0; i<n;i++) {
        var param = {};
        chmod = "444";owner="root";group="root";
        re = glob[i].split(/[\s]+/);
        chmod = re[1];
        encodeType = re[6];
        sourceGlob = re[5];
        if (re[2]!="-"){
            owner = re[2];
        }

        if (re[3]!="-"){
            group = re[3];
        }
        var installDir = re[4].replace(/[^\/]+$/, '');
        var tmpMatch = re[4].match(/([^\/]+)$/);
        var installName = "";
        encodePath = encodeRPath + "/"+installDir;
        mkdir(encodePath);
        if (tmpMatch && tmpMatch[1]) {
            installName = tmpMatch[1];
            encodePath += installName;
        } 


        //get param
        var s = glob[i].match(REG_param);
        if(s && s.length){
            for (var j=0; j<s.length; j++) {
                var k = s[j].match(REG_param2);
                param[k[1]] = k[2];
            }
        }
        var cmd2 = "";
        if (!encodeType) {
            if (sourceGlob.substr(-1, 1) == "/") {
                //cp dir
                encodePath = encodePath.replace(/\/{2,}/, '/'); 
                cmd2 = "cp -r "+sourceGlob+"  " + encodePath;
                print_r(cmd2);
                execSync(cmd2);

                //remove .svn .xxx.swp
                cmd2 = "cd " + encodePath + " && find -name '*.swp' -or -name '*.svn*' | xargs  -n 1 sudo rm -rf";
                execSync(cmd2);
            } else {//cp file
                cmd2 = "cp  "+sourceGlob+"  " + encodePath;
                print_r(cmd2);
                execSync(cmd2);
            }
        } else {
            dispatchEncodeType(encodePath, sourceGlob, encodeType, encodeRPath, param);
        }
    }

}/*}}}*/


/*
 * chose one encode type , css ,closure ,php_c1
 * @param 
 */
function dispatchEncodeType(toPath, glob, type, encodeRPath , param){/*{{{*/
    var fileList = execSync("ls "+glob).split(/[\n\r]+/); 
    for (pro in fileList) {
        if (!isFile(fileList[pro])) { 
            continue;
        }
        var fileName = getFileName(fileList[pro]);

        if (!fileName) {
            return "";
        }
        print_r("ecnode file "+fileList[pro]+"\n");
        switch(type){
            case "closure":
                execSync("java -jar /usr/local/lib/java/closurecompiler.jar --js  \""+fileList[pro]+"\" --js_output_file "+toPath+"/"+fileName);
                break;
            case "css_sprite":
                var css = new _CSS(); 
                var t = glob.lastIndexOf('/');
               // var rootPath = glob.substr(0, t+1);
                css.rootPath = param.rootPath;
                css.spritePath = encodeRPath+"/"+param.homePath+"/sprite";
                css.relativePath = "/";
                mkdir(css.spritePath);
                toPath = toPath.replace(/\/{2,}/,"/");
                var css_content = css.main(fileList[pro]); 
                file_put_contents(toPath+"/"+fileName , css_content);
                break;
            case "css":
                //yui compress
                execSync("cat "+fileList[pro]+" | java -jar  /usr/local/lib/java/yuicompressor-2.4.6.jar --charset utf8 --type css -o "+toPath+"/"+fileName); 
                break;
            case "php_c1"://only remove comment
                //yui compress
                var res = execSync("php /usr/local/bin/phpcompress/phpcompress.php "+ fileList[pro] +" "+toPath+"/"+fileName+" c1"); 
                print_r(res);
                break;
            case "xml_encoding":
                var text = file_get_contents(fileList[pro]);
                text = text.replace(/</g,'![');
                text = text.replace(/>/g,'!]');
                text = base64_encode(text);
                //fileName = fileName.replace(/\.xml/,'');
                file_put_contents(toPath+"/"+fileName , text);
                break;
            default:
                break;
        }
    }
}/*}}}*/


function checkInCPCommand() {
    return false;
}

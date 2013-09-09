/***********
do CSS Sprint and remove \n\r
mkdir /tmp/css_sprite
cp image to /tmp/css_sprite/[property]/ , keeping the image relative path

***********/

var _mime = require('mime');
var conf = require('config.sjs');
var _GD = require(conf.SP_library + '/gd/GDBasic.sjs').GDBasic;
var GD = new _GD();

function css() {/*{{{*/
    this.homeUrl = "/"; // website home path 
    this.rootPath = this.PropertyPath = "/www/inner_case/ewebsite222"; //css file  path in linux
    this.relativePath = "/";
    this.spritePath = "/sprite";
    this.property = "testProperty";
    this.sprite_tmp_path = "/tmp/rpm_tmp/css_sprite";
    this.spritePrefix = ["H","V"];
    this.spriteInfoFile = "/tmp/spriteInfo"; //A file keep data of sprite position
    this.spriteInfoList = [];
}/*}}}*/

var o = css.prototype;

o.main = function(file) {
    var css_data = file_get_contents(file);
    return this.setCssBackground(css_data);
}

/*
 * get sprite image path , filename  in linux    
 */
o.getSpriteFilePath = function(imgBGUrl, type) {/*{{{*/
    var imgFile = this.getCssImageRelativeUrl(imgBGUrl);
    imgFile = imgFile.replace(/[^\.\\\/]+\.[^\.\\\/]+$/, "");
    imgFile = imgFile.substr(this.relativePath.length , imgFile.length - this.relativePath.length); 

    var ph = imgFile.replace(/[\/]?[^\/\.]+\.[a-z]{3,4}/i,'');
    ph = ph.replace(/\/{2,}/g, "/");
    ph = ph.replace(/[\/]/g,'-');
    var path = this.spritePath+"/"+ph+"-"+type+".png";
    path = path.replace(/-{2,}/g, "-");
    path = path.replace(/\/{2,}/g, "/");
    return path;
}/*}}}*/

/*
@param imgFile background url relative path
@param type H or  V
*/
o.getSpriteFileWebPath = function(imgFile, type) {/*{{{*/
//    var REG = RegExp(this.PropertyPath.replace(/\//i,'\/'), "i");
//    var ph = this.sprite_path+imgFile.replace(REG, '');
    var imgFile = this.getCssImageRelativeUrl(imgFile);
    imgFile = imgFile.substr(this.relativePath.length , imgFile.length - this.relativePath.length);
    var ph = imgFile.replace(/[\/]?[^\/\.]+\.[a-z]{3,4}/i,'');
    ph = ph.replace(/\//,'-');
    var path = this.relativePath+"/sprite/"+ph+"-"+type+".png";
    path = path.replace(/\/{2,}/, "/");
    return path;
}/*}}}*/

/* 
merge image to sprite
@param spritePath tmp
@return sprite image position 
*/
o.mergeSpriteFile = function (imgFile, imgBGUrl, type) {/*{{{*/
    if (!isFile(imgFile)) {
        print_r(imgFile + "is not a file");
        return "";
    }
    var REG = RegExp(this.PropertyPath.replace(/\//i,'\/'), "i");
    var cpFile = this.sprite_tmp_path+imgFile.replace(REG,'');
    var spriteFile = this.getSpriteFilePath(imgBGUrl, type);
    imgFile = imgFile.replace(/\/{2}/g,'\/');
    var x=0, y=0;

//    print_r( "sprite = " + spriteFile + "\nimgFile = "+imgFile);
    if (isFile(cpFile)) {
        //had copyed before
        //print_r("had cp");print_r(this.getSpriteInfo(imgFile));
        return this.getSpriteInfo(imgFile);
    }
    else if (!isFile(spriteFile)) {
//        print_r("create sprite");
        GD.copy(imgFile, spriteFile);
    } else {
        var spriteInfo = GD.getImageInfo(spriteFile);
        var imgInfo = GD.getImageInfo(imgFile);
        if (type == "H"){
            GD.copyResampled(spriteFile, imgFile, spriteInfo.width, 0, 0, 0, imgInfo.width, imgInfo.height, imgInfo.width, imgInfo.height).save(spriteFile, "png"); 
            x = spriteInfo.width;
        }

        if (type == "V"){
            GD.copyResampled(spriteFile, imgFile, 0, spriteInfo.height, 0, 0, imgInfo.width, imgInfo.height, imgInfo.width, imgInfo.height).save(spriteFile, "png"); 
            y = spriteInfo.height;
        }
        this.saveSpriteInfo(imgFile,x,y);
    }

    var dir = cpFile.replace(/[^\/\.]+\.[a-z]+/i,'');
    mkdir(dir);
    execSync("cp "+imgFile+" "+cpFile);
//print_r("x = "+x +"  y = "+y);
    return {
        "x":x,
        "y":y
    };

}/*}}}*/

/* 
check the image name , if name equal xxx-H , xxx-V , merge it
result: 
    mergrType: -1 : fail   , 0-n : success
*/
o.isMerge = function(image_name) {/*{{{*/
    var n = this.spritePrefix.length;
    for( var i=0; i<n ; i++) {
        var prefix = this.spritePrefix[i];
        REG = new RegExp("-"+prefix+"\.[a-z]{3,4}$" ,"i");
        if (image_name.match(REG)) {
            return i;
        }

    }
    return -1;
}/*}}}*/

/**
generate array data to css code => background
input: array( "url","position_x","position_y" );

**/
o.setBgAttrStyle = function (bk) {/*{{{*/
    var result = "background-image: ";
    if (!bk.position_x) {bk.position_x=0;} 
    if(!bk.position_y) {bk.position_y=0;}
    if (!bk.image) {
        return "";
    }

    bk.position_y = bk.position_y * (-1);
    if (bk.mime) {
        result += sprintf("url(\"data:%s;base64,%s\");", bk.mime, bk.dataURI);
        result += sprintf("*background-image: url(\"%s\");", bk.image_src);

    } else {
        result += sprintf("url(\"%s\")", bk.image);
        result += sprintf(" %spx %spx", bk.position_x, bk.position_y);
        result += sprintf(" no-repeat;");
    }
    return result;
}/*}}}*/

/**
Removing background background-image background-position background-repeat;
**/
o.removeImageCss = function (ay){/*{{{*/
    var n = ay.length;
    for (var i =0; i<n; i++) {
        if(ay[i].match(/background-image[a-z\-]*:[\s]*[^\n]+/)){
            ay[i] = "";
        }
    }
    return ay;
}/*}}}*/

/*
combine background-image , background-position , background-repeat 
background : url  , position  repeat
*/
o.setCssBackground = function (data) {/*{{{*/
    var result = "";
    var bg = {
        "image":"",
        "position":"",
        "repeat":""
    };
//    data = data.replace(/\/\*(.|:)+\*\//mg, '');
    var REG_contain = /[^\{]+{[^{}]+}/g;
    var REG_bk = /background[\s]*:([^\n]+)/i;
    var REG_bk_url = /url\([\'\"]?([^)'"]+)[\'\"]?\)/i;
    var REG_bk_pos = /([0-9])+px[\s]+([0-9])+px/i;

    var REG_pos = /background-position[\s]*:[\s]*([0-9]+)px[\s]+([0-9]+)px/i;
    var REG_url = /background-image:[\s]*url\(['"]?([^)'"]+)['"]?\)[;]?/i;


    var cssDataList={},res_url;
    //get element in {}
    var con = data.match(REG_contain);

    var nc = con.length;
    for (var j =0 ; j<nc; j++) {
        //init clear bg
        bk = {
            "image":"",
            "position_x":"",
            "position_y":"",
            "repeat":"",
            "mime":""
        };

        var d = con[j].split(/[\n]/);

        var n = d.length,line;
        this.setBgAttrStyle(d);
        //get container background attributes
        for (var i=0; i<n; i++) {/*{{{*/
            line = d[i];
/*            if (line.match(REG_bk)) {
                res_url = line.match(REG_bk_url);
                if (res_url) {
                    bk.image = res_url[1];
                }
                res_pos = line.match(REG_bk_pos);
                if (res_pos) {
                    bk.position_x = res_pos[1];
                    bk.position_y = res_pos[2];
                }

            }
*/
            var res_url = line.match(REG_url);
            if (res_url) {
                bk.image = res_url[1];
            }
/*
            var res_pos = line.match(REG_pos);
            if (res_pos) {
                bk.position_x = res_pos[1];
                bk.position_y = res_pos[2];
            }
*/
        }/*}}}*/

        if(bk.image) {
            bk.image_src = bk.image;
            var res_name = bk.image.match(/([^\\\.\/]+\.[a-z]{3,4})/i);
            var image_name = res_name[1];
            var imagePath = this.combinePath(this.rootPath+"/", bk.image);
            if (image_name) {
                var mergeType = this.isMerge(image_name);
                if (mergeType != -1) {
                    bk.position_x = 0;
                    bk.position_y = 0;
                    var prefix = this.spritePrefix[mergeType];
                    //var spriteTmpPath = this.sprite_tmp_path+ "/"+ this.property+"/"+this.getSpritePath(image_name);
                    var pos = this.mergeSpriteFile(imagePath, bk.image,  prefix);
                    var dataURI = this.convertImageToDataURI(imagePath);
                    var mime = _mime.lookup(bk.image);
                    bk.dataURI = dataURI;
                    bk.mime = mime;
                    if(prefix == "H")
                        bk.position_x = pos.x;
                    else
                        bk.position_y = pos.y;
                    this.removeImageCss(d);
                    var spriteFileWebPath = this.getSpriteFileWebPath(bk.image, prefix);
                    bk.image = spriteFileWebPath;
                    var background = this.setBgAttrStyle(bk);
                    d[n-1] = background;
                    d[n] = "}";
                }
            }            
        }
        n = d.length;
        for (i=0; i < n; i++) {
            line = d[i];
            if (line) {
                result += trim(line);
            }
        }
    }
    return result;
}
/*}}}*/


o.convertImageToDataURI = function(imgFilePath) {/*{{{*/
    var content = file_get_contents(imgFilePath);
    var dataURI = base64_encode(content);
    return dataURI;
}/*}}}*/

/**
merge  cssPath+imagePath :  set ../ to parent
@param imgPath image relative Path
***/
o.getCssImageRelativeUrl = function(imgPath){/*{{{*/
    var relativePath = this.relativePath.split(/\//);
    if (relativePath[relativePath.length-1] == "") {
        relativePath.pop();
    }
    var p = imgPath.split(/\//);
    var n = p.length;
    for (var i=0; i<n; i++) {
        if (p[i] == '..') {
            relativePath.pop();
        } else {
            relativePath.push(p[i]);
        }
    }

    var path = "";
    n = relativePath.length;
    for (i=0; i < n ; i++) {        
        if (relativePath[i])
            path += "/"+relativePath[i];       
    }
    return path;
}/*}}}*/

o.getSpritePrefix = function(imgFilename){/*{{{*/
    var t = imgFilename.lastIndexOf('-');
    var pre = imgFilename.substr(t+1 , 1);
    var n =  this.spritePrefix.length;
    for (var i=0; i< n; i++ ) {
        if(pre ==  this.spritePrefix[i]){
            return pre;
        }
    }
    return "";
}/*}}}*/

/**
merge  cssPath+imagePath :  set ../ to parent
@param imgPath image relative Path
@result sprite filename
***/
o.getSpriteFilename = function(imgWebUrl){/*{{{*/
    var prefix = this.getSpritePrefix(imgWebUrl);
    var url = this.getCssImageRelativeUrl(imgWebUrl).split(/\//);
    var path = "sprite";
    var n = url.length-1;
    for(var i =0; i<n;i++){
        if(url[i]) {
            path += "-"+url[i]
        }
    }
    return path+"-"+prefix+".png";
}/*}}}*/


/*
 * @param path1    /a/b
 * @param path2    ../c/d
 * @result    /a/c/d
 */
o.combinePath = function(p1, p2){/*{{{*/
    var p1 = p1.split(/\//);
    while (p1[p1.length-1] == "") { p1.pop();}
    var p2 = p2.split(/\//);
    
    var n2 = p2.length;
    for(var i=0; i < n2 ; i++){
        if (p2[i] == '..'){
            p1.pop();
        } else {
            p1.push(p2[i]);
        }
    } 
    
    var n1 = p1.length;
    var path = "";
    for (i=0; i<n1; i++){
        path += "/" + p1[i];
    }
    return path;
}/*}}}*/

/*
 * save x and y in file
 *
 */
o.saveSpriteInfo = function(imgFile, x, y){
    //file_put_contents(this.spriteInfoFile, );
    this.spriteInfoList[imgFile] = x+":"+y;
}

/*
 * get sprite position about x and y
 * @return {x:x,y:y}
 */
o.getSpriteInfo = function(imgFile){
    for(pro in this.spriteInfoList){
        if(pro == imgFile){
            var s = this.spriteInfoList[pro].split(/:/);
            return {x:s[0], y:s[1]};
        }
    }
    return {x:0,y:0};
}

exports.css_compress = css; 
//var css_data = file_get_contents();


//var cssfile = "css_test.css";
//var s = new css();
//s.main(cssfile);


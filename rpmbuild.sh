PKGPATH=`pwd`

rpm_init(){
    dir=$1
    rpm_remove_pre
    mkdir /tmp/rpm_tmp/SOURCES/$dir
    RPM_TMP=/tmp/rpm_tmp/
    SOURCES=/tmp/rpm_tmp/SOURCES
}

rpm_remove_pre(){
    path=/tmp/rpm_tmp
    mkdir -p $path/RPMS $path/SOURCES $path/BUILD $path/SPECS $path/RPMS
    rm -rf $path/RPMS/*
    rm -rf $path/SOURCES/*
    rm $path/*rpm 
}

rpm_cp(){
    local dir=$1
    local dest=$2
    local grep=$3
    local lv=$4
    if [ "x$lv" == "x" ];then
        d=`echo  "$dir" | grep  -oe [^\/]*$`
        mkdir $dest/$d
        dest=$dest/$d
    fi
    for file in $(find $dir -type d -maxdepth 1); do
        if [ $file = $dir ];then
            continue;
        fi;
        dir_name=`echo  "$file" | grep  -oe [^\/]*$`
        mkdir $dest/$dir_name
        rpm_cp $dir/$dir_name $dest/$dir_name $grep 1
    done

    for file in $(find $dir -type f -maxdepth 1 -iname "$grep" ); do
        file_name=`echo  "$file" | grep  -oe [^\/]*$`
        ext=`s="$file"; a=(${$s//\./ }); echo ${a[1]}`
        input=$dir/$file_name
        output=/tmp/$file_name
        genFile $input $ext $output
        cp  $output $dest/$file_name
        
    done

}

#gen js file  , encode php
genFile(){
    local file=$1
    local ext=$2
    local output=$3
    if [ "x$ext" = "xjs" ]; then
        java -jar /home/program/lib/closurecompiler.jar --js $file --js_output_file $output
    else
        cp $file $output
    fi

}


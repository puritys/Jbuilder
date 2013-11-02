all:
	if [ ! -d /usr/local/builder/ ]; then mkdir /usr/local/builder/ ; fi
	if [ ! -d /usr/local/lib/java/ ]; then mkdir /usr/local/lib/java/ ; fi
	cp *.jar /usr/local/lib/java/
	cp Makefile_* /usr/local/builder/
	cp rpmbuild* /usr/local/bin
	cp rpmbuild.sjs /usr/local/bin/Jbuild
	cp -r phpcompress/ /usr/local/bin/

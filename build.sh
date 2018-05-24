#!/bin/bash

# use -i'bkp' to support sed on osx and linux
#
# relative scripts path
sed -i'bkp' -e "s/src=\(.\)\//src=\1/g" www/index.html
# relative styles path
sed -i'bkp' -e "s/href=\(.\)\//href=\1/g" www/index.html

maincss=$(find "www/bundles/styles" -name "main.*css")

sed -i'bkp' -e "s/\/images/images/g" www/bundles/styles/"${maincss##*/}"

sed -i'bkp' -e "s/bundles\/fonts/..\/fonts/g" www/bundles/styles/"${maincss##*/}"
sed -i'bkp' -e "s/bundles\/fonts/..\/fonts/g" www/bundles/styles/main.css

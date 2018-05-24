#!/bin/bash
rm -rf www/bundles

npm run webpack

./fixpaths.sh

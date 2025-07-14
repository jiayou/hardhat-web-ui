#!/bin/bash

SCRIPTPATH=$( cd -- "$(dirname "$0")" >/dev/null 2>&1 ; pwd -P )

grep -rh 'data-i18n=' $SCRIPTPATH/../public | grep -o 'data-i18n=\"[^\"]*\"' | sort | uniq

grep -r -o -h -E '\{t\([^\}]+\)\}' $SCRIPTPATH/../public/ | sort | uniq


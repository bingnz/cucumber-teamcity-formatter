# cucumber-teamcity-formatter

> Formatter for cucumber-js to write test output to the console in a format parsable by TeamCity.

[![Build Status](https://app.travis-ci.com/bingnz/cucumber-teamcity-formatter.svg?branch=master)](https://app.travis-ci.com/bingnz/cucumber-teamcity-formatter)
[![Code Climate](https://codeclimate.com/github/bingnz/cucumber-teamcity-formatter/badges/gpa.svg)](https://codeclimate.com/github/bingnz/cucumber-teamcity-formatter)
[![Test Coverage](https://codeclimate.com/github/bingnz/cucumber-teamcity-formatter/badges/coverage.svg)](https://codeclimate.com/github/bingnz/cucumber-teamcity-formatter)
[![Dependency Status](https://david-dm.org/bingnz/cucumber-teamcity-formatter.svg)](https://david-dm.org/bingnz/cucumber-teamcity-formatter)
[![devDependency Status](https://david-dm.org/bingnz/cucumber-teamcity-formatter/dev-status.svg)](https://david-dm.org/bingnz/cucumber-teamcity-formatter#info=devDependencies) 

## Install

```
$ npm install cucumber-teamcity-formatter --save-dev
```


## Usage

Use the `--format` command line option for cucumber js as described [here](https://github.com/cucumber/cucumber-js/blob/master/docs/cli.md#formats).

For example:
```
$ node_modules/.bin/cucumber --format node_modules/cucumber-teamcity-formatter
```

const gulp = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const del = require('del');
const path = require('path');
const isparta = require('isparta');
const webpackStream = require('webpack-stream');

const Instrumenter = isparta.Instrumenter;
const mochaGlobals = require('./test/setup/.globals');
const manifest = require('./package.json');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');
const babel = require('babel-core/register');

// Load all of our Gulp plugins
const $ = loadPlugins();

// Gather the library data from `package.json`
const mainFile = manifest.main;
const destinationFolder = path.dirname(mainFile);
const exportFileName = path.basename(mainFile, path.extname(mainFile));

function cleanDist(done) {
    del([destinationFolder]).then(() => done());
}

function cleanTmp(done) {
    del(['tmp']).then(() => done());
}

// Lint a set of files
function lint(files) {
    return gulp
        .src(files)
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError());
}

function lintSrc() {
    return lint('src/**/*.js');
}

function lintTest() {
    return lint('test/**/*.js');
}

function lintGulpfile() {
    return lint('gulpfile.js');
}

function build() {
    return gulp
        .src(path.join('src', 'cucumber-teamcity-formatter.js'))
        .pipe(
            webpackStream({
                target: 'node',
                output: {
                    filename: `${exportFileName}.js`,
                    libraryTarget: 'umd',
                    library: 'TeamCityFormatter',
                    devtoolModuleFilenameTemplate: '[absolute-resource-path]'
                },
                externals: [nodeExternals()],
                module: {
                    loaders: [{ test: /\.js$/, exclude: /node_modules/, loader: 'babel-loader' }]
                },
                plugins: [new UglifyJSPlugin({ sourceMap: true })],
                devtool: 'source-map'
            })
        )
        .pipe(gulp.dest(destinationFolder));
}

function _mocha() {
    return gulp.src(['test/setup/node.js', 'test/unit/**/*.js'], { read: false }).pipe(
        $.mocha({
            compilers: {
                js: babel
            },
            reporter: 'dot',
            globals: Object.keys(mochaGlobals.globals),
            ignoreLeaks: false
        })
    );
}

function _registerBabel() {
    require('babel-register');
}

function test() {
    return _mocha();
}

function coverage(done) {
    _registerBabel();
    gulp
        .src(['src/**/*.js'])
        .pipe(
            $.istanbul({
                instrumenter: Instrumenter,
                includeUntested: true
            })
        )
        .pipe($.istanbul.hookRequire())
        .on('finish', () => {
            return test()
                .pipe($.istanbul.writeReports())
                .on('end', done);
        });
}

const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc'];

// Run the headless unit tests as you make changes.
function watch() {
    gulp.watch(watchFiles, ['test']);
}

// Remove the built files
gulp.task('clean', cleanDist);

// Remove our temporary files
gulp.task('clean-tmp', cleanTmp);

// Lint our source code
gulp.task('lint-src', lintSrc);

// Lint our test code
gulp.task('lint-test', lintTest);

// Lint this file
gulp.task('lint-gulpfile', lintGulpfile);

// Lint everything
gulp.task('lint', ['lint-src', 'lint-test', 'lint-gulpfile']);

// Build two versions of the library
gulp.task('build', ['lint', 'clean'], build);

// Lint and run our tests
gulp.task('test', ['lint'], test);

// Set up coverage and run tests
gulp.task('coverage', ['lint'], coverage);

// Run the headless unit tests as you make changes.
gulp.task('watch', watch);

// An alias of test
gulp.task('default', ['test']);

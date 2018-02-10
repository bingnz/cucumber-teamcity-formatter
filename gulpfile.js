const gulp = require('gulp');
const loadPlugins = require('gulp-load-plugins');
const del = require('del');
const path = require('path');
const webpackStream = require('webpack-stream');

const manifest = require('./package.json');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

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

// Run the headless unit tests as you make changes.
gulp.task('watch', watch);

gulp.task('default', ['build']);

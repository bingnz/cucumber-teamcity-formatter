import gulp from 'gulp';
import loadPlugins from 'gulp-load-plugins';
import del from 'del';
import path from 'path';
import webpackStream from 'webpack-stream';

import manifest from './package.json';
import UglifyJSPlugin from 'uglifyjs-webpack-plugin';
import nodeExternals from 'webpack-node-externals';
import mochaGlobals from './test/setup/.globals';

// Load all of our Gulp plugins
const $ = loadPlugins();

// Gather the library data from `package.json`
const mainFile = manifest.main;
const destinationFolder = path.dirname(mainFile);
const exportFileName = path.basename(mainFile, path.extname(mainFile));

export function clean() {
    return del(['.nyc_output', 'coverage', destinationFolder]);
}

// Lint a set of files
function lintFiles(files) {
    return gulp
        .src(files)
        .pipe($.eslint())
        .pipe($.eslint.format())
        .pipe($.eslint.failAfterError());
}

function lintSrc() {
    return lintFiles('src/**/*.js');
}

function lintTest() {
    return lintFiles('test/**/*.js');
}

function lintGulpfile() {
    return lintFiles('gulpfile.babel.js');
}

function compile() {
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

function mocha() {
    return gulp.src(['test/setup/node.js', 'test/unit/**/*.js'], { read: false }).pipe(
        $.mocha({
            require: 'babel-core/register',
            reporter: 'dot',
            globals: Object.keys(mochaGlobals.globals),
            ignoreLeaks: false
        })
    );
}

// Lint everything
const lint = gulp.parallel(lintSrc, lintTest, lintGulpfile);
export { lint };

const build = gulp.series(gulp.parallel(lint, clean), compile);
export { build };

const watchFiles = ['src/**/*', 'test/**/*', 'package.json', '**/.eslintrc'];

// Run the headless unit tests as you make changes.
export function watch() {
    gulp.watch(watchFiles, test);
}

const test = gulp.series(build, mocha);
export { test };

export default test;



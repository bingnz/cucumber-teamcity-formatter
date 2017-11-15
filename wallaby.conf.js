'use strict';

const path = require('path');

module.exports = function(wallaby) {
    process.env.NODE_PATH += path.delimiter + path.join(wallaby.localProjectDir, 'functions', 'node_modules');
    return {
        files: [
            { pattern: 'test/setup/**/*.js' },
            { pattern: 'src/**/*.js' }
        ],

        tests: [
            { pattern: 'test/unit/**/*.js' }
        ],

        testFramework: 'mocha',

        compilers: {
            '**/*.js': wallaby.compilers.babel()
        },

        env: {
            type: 'node'
        },

        setup: (wallaby) => {
            require('./test/setup/libraries');
            require('./test/setup/setup')(global, wallaby.testFramework.suite);
        }
    };
};

import path from 'path';
import webpackConfig from './webpack/config.karma.babel';

module.exports = config => {
    config.set({
        hostname: 'localhost',
        port: 8099,
        autoWatch: false,
        // autoWatchBatchDelay: 300,
        singleRun: true,

        client: {
            captureConsole: true,
            clearContext: true,
            useIframe: false,
            runInParent: true,
        },
        // Concurrency level
        // how many browser should be started simultaneous
        browsers: ['Chrome'],
        concurrency: Infinity,
        browserNoActivityTimeout: 1000000,

        // include custom karma.plugin
        plugins: ['karma-*', path.resolve(__dirname, './tests/karma/karma.plugin.js')],
        frameworks: ['jasmine', 'webpack'],
        preprocessors: {
            './tests/common.setup.js': 'webpack',
            './tests/__txcache__/index.js': 'cachedTx', // custom preprocessor in karma.plugin
            './tests/karma/**/*.test.js': ['webpack'],
            './src/js/**/*.js': 'coverage',
        },
        files: [
            './tests/common.setup.js',
            './tests/__txcache__/index.js',
            './tests/karma/**/*.test.js',
            {
                pattern: 'build/**/*.*',
                watched: false,
                included: false,
                served: true,
                nocache: true,
            },
        ],

        colors: true,
        logLevel: config.DEBUG,
        webpackMiddleware: {
            stats: 'errors-only',
        },
        webpack: webpackConfig,

        reporters: ['progress', 'coverage', 'trezor'],
        coverageReporter: {
            dir: 'coverage',
            reporters: [
                {
                    type: 'html',
                    subdir: 'report-html',
                },
            ],
            instrumenterOptions: {
                istanbul: {
                    noCompact: true,
                },
            },
        },
    });
};

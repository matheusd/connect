// Karma custom plugin
// TODO: move jasmine matcher from karma/methods.test.js
// TODO: move expect.any workaround from _fixtures/getFeatures

const { CACHE } = require('../__txcache__');

const TrezorReporter = (rootConfig, logger) => {
    const log = logger.create('reporter.trezor');

    return {
        onRunStart: () => {
            log.info('Running trezor-connect tests...');
            log.info('FW:', process.env.TESTS_FIRMWARE);
            log.info('Methods:', process.env.TESTS_INCLUDED_METHODS || 'All');
        },

        onSpecStart: (_browser, spec) => {
            log.warn('onSpecStart', spec);
        },

        onSpecComplete: (_browser, spec) => {
            log.info('onSpecComplete...', spec.fullName);
            log.info('onSpecComplete success:', spec.success);
            // if (spec.success) {
            //     log.info(spec.fullName);
            // } else {
            //     log.error(spec.fullName, 'failed');
            // }
        },

        onRunComplete: () => {
            log.warn('onRunComplete');
        },

        onExit: done => {
            log.warn('onExit');
            // stop user env?
            done();
        },
    };
};

TrezorReporter.$inject = ['config', 'logger'];

// node.js "fs" package is not available in karma (browser) env.
// stringify CACHE object and inject it into a browser global.TestUtils context
const cachedTxPreprocessor = (_logger, _basePath) => (content, file, done) => {
    done(`const CACHE=${JSON.stringify(CACHE)}; TestUtils.TX_CACHE = hash => CACHE[hash];`);
};
cachedTxPreprocessor.$inject = ['logger', 'config.basePath'];

module.exports = {
    'preprocessor:cachedTx': ['factory', cachedTxPreprocessor],
    'reporter:trezor': ['type', TrezorReporter],
};

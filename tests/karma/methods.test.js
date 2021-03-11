import fixtures from '../__fixtures__';

const { setup, skipTest, initTrezorConnect, Controller, TrezorConnect } = global.Trezor;

let controller;
let currentMnemonic;

fixtures.forEach(testCase => {
    describe(`TrezorConnect.${testCase.method}`, () => {
        beforeAll(async done => {
            jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
            // jasmine is missing toMatchObject matcher (deeply partial matching)
            // not perfect, but its working
            jasmine.addMatchers({
                toMatchObject: _obj => ({
                    compare: (actual, expected) => {
                        const success = { pass: true, message: 'passed' };
                        if (actual === expected) return success;
                        if (expected === null || typeof expected !== 'object') {
                            return {
                                pass: false,
                                message: 'toMatchObject: "expected" is not a object',
                            };
                        }

                        const nested = obj =>
                            Object.keys(obj).reduce((match, key) => {
                                if (Array.isArray(obj[key])) {
                                    match[key] = jasmine.arrayContaining(
                                        obj[key].map(item => {
                                            if (typeof item === 'object') {
                                                return jasmine.objectContaining(nested(item));
                                            }
                                            return item;
                                        }),
                                    );
                                } else if (
                                    obj[key] &&
                                    typeof obj[key] === 'object' &&
                                    typeof obj[key].expectedObject === 'function'
                                ) {
                                    // jasmine matcher (used in getFeatures test)
                                    match[key] = obj[key];
                                } else if (obj[key] && typeof obj[key] === 'object') {
                                    match[key] = jasmine.objectContaining(nested(obj[key]));
                                } else {
                                    match[key] = obj[key];
                                }
                                return match;
                            }, {});

                        expect(actual).toEqual(jasmine.objectContaining(nested(expected)));
                        return success;
                    },
                }),
            });

            try {
                if (!controller) {
                    controller = new Controller({
                        url: 'ws://localhost:9001/',
                        name: testCase.method,
                    });
                    controller.on('error', error => {
                        controller = undefined;
                        console.log('Controller WS error', error);
                    });
                    controller.on('disconnect', () => {
                        controller = undefined;
                        console.log('Controller WS disconnected');
                    });
                }

                if (testCase.setup.mnemonic !== currentMnemonic) {
                    await setup(controller, testCase.setup);
                    currentMnemonic = testCase.setup.mnemonic;
                }

                await initTrezorConnect(controller, {
                    popup: false,
                    connectSrc: 'http://localhost:8099/base/build/',
                });

                done();
            } catch (error) {
                console.log('Controller WS init error', error);
                done(error);
            }
        }, 30000);

        afterAll(done => {
            TrezorConnect.dispose();
            done();
        });

        testCase.tests.forEach(t => {
            // check if test should be skipped on current configuration
            const testMethod = skipTest(t.skip) ? it.skip : it;
            testMethod(
                t.description,
                async done => {
                    if (!controller) {
                        done(new Error('Controller not found'));
                        return;
                    }

                    if (t.mnemonic && t.mnemonic !== currentMnemonic) {
                        // single test requires different seed, switch it
                        await setup(controller, { mnemonic: t.mnemonic });
                        currentMnemonic = t.mnemonic;
                    } else if (!t.mnemonic && testCase.setup.mnemonic !== currentMnemonic) {
                        // restore testCase.setup
                        await setup(controller, testCase.setup);
                        currentMnemonic = testCase.setup.mnemonic;
                    }

                    controller.options.name = t.description;
                    const result = await TrezorConnect[testCase.method](t.params);
                    const expected = t.result
                        ? { success: true, payload: t.result }
                        : { success: false };
                    expect(result).toMatchObject(expected);
                    done();
                },
                t.customTimeout || 20000,
            );
        });
    });
});

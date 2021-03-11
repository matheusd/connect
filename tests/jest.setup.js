import { TX_CACHE } from './__txcache__';

jest.setTimeout(20000);

global.TestUtils = {
    ...global.TestUtils,
    TX_CACHE,
};

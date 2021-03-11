# trezor-connect tests
## Continuous integration

Tests are running on [Github CI](https://github.com/trezor/connect/actions/workflows/tests.yml) and [SatoshiLabs Gitlab CI](https://gitlab.com/satoshilabs/trezor/connect/-/pipelines)

Testing environment is powered by [trezor-user-env](https://github.com/trezor/trezor-user-env)

## How to run tests locally
1. Install docker
1. See options `./test/run.sh -h`;
1. Run all tests `./tests/run.sh`
1. To run tests with graphical output from emulator, use `-g` option. Note that macOS needs some [further configuration](https://github.com/trezor/trezor-user-env#macos).
1. To limit tests to subset of methods use `./test/run.sh -i getPublicKey,getAddress`

## How to add tests
1. Create or modify file in `./__fixtures__`
1. Make sure it is imported in `./__fixtures__/index.js`.
1. Make sure the method you are testing is listed in `.github/workflows/*.yml` and `.gitlab-ci.yml`

#!/usr/bin/env bash

# This script helps you to run trezor-connect tests locally.
# It sets up trezor-user-env and required evironment variables

set -e

function cleanup() {
  echo "Cleaning up"
  echo "Stopping container with an ID $id"
  # uncomment to show logs from container, useful for debugging
  # docker logs $id
  docker stop "$id" && echo "Stopped"
}

trap cleanup EXIT

function runDocker() {
  # fetch latest image, can be commented out if you do not need latest master
  echo "Pulling latest trezor-user-env"
  
  docker pull registry.gitlab.com/satoshilabs/trezor/trezor-user-env/trezor-user-env

  if [ $GUI = false ]; then
    id=$(
      docker run -d \
        -e SDL_VIDEODRIVER="dummy" \
        -p "9001:9001" \
        -p "21326:21326" \
        -p "21325:21326" \
        registry.gitlab.com/satoshilabs/trezor/trezor-user-env/trezor-user-env \
        "/trezor-user-env/run.sh"
    )
    echo "Running docker container with an ID $id"

  else
    xhost +
    id=$(
      docker run -d \
        -e DISPLAY=:0 \
        --network host \
        -p "9001:9001" \
        -p "21326:21326" \
        -p "21325:21326" \
        registry.gitlab.com/satoshilabs/trezor/trezor-user-env/trezor-user-env \
        "/trezor-user-env/run.sh"
    )

    echo "Running docker container with a GUI support with ID: $id"
  fi
}

function waitForEnv() {
  echo "Waiting for the trezor-user-env to load up"
  i=0
  while ! netstat -tna | grep 'LISTEN\>' | grep -q ':9001\>'; do
    if [ $i -gt 10 ]; then
      echo "trezor-user-env is not running. exiting"
      exit 1
    fi
    echo "Waiting..."
    ((i=i+1))
    sleep 1
  done
  echo "trezor-user-env loaded up"
}

run() {
  if [ $DOCKER = true ]; then
    runDocker
  fi

  waitForEnv

  echo "Running ${TEST_SCRIPT}"
  echo "    Firmware: ${FIRMWARE}"
  echo "    Included methods: ${INCLUDED_METHODS}"
  echo "    Excluded methods: ${EXCLUDED_METHODS}"

  # run actual test script
  ${TEST_SCRIPT}
}

show_usage() {
  echo "Usage: run [OPTIONS] [ARGS]"
  echo ""
  echo "Options:"
  echo "  -d       Disable docker. Useful when running own instance of trezor-user-env"
  echo "  -g       Enables docker tests with emulator graphical output"
  echo "  -f       Use specific firmware version, example: 2.1.4., 1.8.0. default: 2-master"
  echo "  -i       Included methods only, example: applySettings,signTransaction"
  echo "  -e       All methods except excluded, example: applySettings,signTransaction"
  echo "  -s       actual test script. default: 'yarn test:integration'"
}

FIRMWARE='2-master'
INCLUDED_METHODS=''
EXCLUDED_METHODS=''
DOCKER=true
GUI=false
TEST_SCRIPT='yarn test:integration'

OPTIND=1
while getopts ":i:e:f:s:hdg" opt; do
  case $opt in
  d)
    DOCKER=false
    ;;
  g)
    GUI=true
    ;;
  s)
    TEST_SCRIPT=$OPTARG
    ;;
  f)
    FIRMWARE=$OPTARG
    ;;
  i)
    INCLUDED_METHODS=$OPTARG
    ;;
  e)
    EXCLUDED_METHODS=$OPTARG
    ;;
  h) # Script usage
    show_usage
    exit 0
    ;;
  \?)
    echo "invalid option $OPTARG"
    exit 1
    ;;
  esac
done
shift $((OPTIND - 1))

export TESTS_FIRMWARE=$FIRMWARE
export TESTS_INCLUDED_METHODS=$INCLUDED_METHODS
export TESTS_EXCLUDED_METHODS=$EXCLUDED_METHODS

run

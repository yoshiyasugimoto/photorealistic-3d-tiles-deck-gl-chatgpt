#!/bin/bash -eu

ssh -N \
  -R ${FORWARD_PORT}:${FORWARD_HOST}:${FORWARD_HOST_PORT} \
  ${SSH_USER}@${SSH_HOST}
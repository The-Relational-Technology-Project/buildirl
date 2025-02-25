#!/bin/bash

if [[ $VERCEL_ENV == "production"  ]] ; then
  yarn run db:migrate
  yarn run build
else
  yarn run db:migrate
  yarn run build
fi
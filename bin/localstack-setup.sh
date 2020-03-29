#!/usr/bin/env bash

echo "Setting Up..."

aws --endpoint-url=http://localhost:4569 \
  --region=$AWS_REGION \
  dynamodb \
  create-table --table-name Sessions  \
  --attribute-definitions AttributeName=id,AttributeType=S \
  --key-schema AttributeName=id,KeyType=HASH \
  --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
  1> /dev/null

aws --endpoint-url=http://localstack:4569 \
  --region=$AWS_REGION \
  dynamodb list-tables
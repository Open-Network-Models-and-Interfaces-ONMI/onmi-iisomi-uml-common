#!/bin/bash

# convert all yang to yin
mkdir ./target/generated-resources
mkdir ./target/generated-resources/yin
for yang in ./src/main/resources/yang/*; 
do 
    bn=$(basename "$yang" .yang);
    pyang -f yin -o  "./target/generated-resources/yin/${bn}.yin" "${yang}"; 
done
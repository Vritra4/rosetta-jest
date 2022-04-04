# rosetta-jest

it takes 30~120 seconds.

for construction/parse, retrieve txs from latest block and test with them
* signed tx: encode to hex and send it
* unsigned tx: remove signatures and do same with signed tx

for construction/preprocess and construction/combine, randomly picked address will be used.

for data/drive, randomly created address will be used.

## how to run test
```
npm i  # only for first time
npm test
```


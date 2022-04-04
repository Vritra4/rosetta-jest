# rosetta-jest

it takes 30~120 seconds.

for construction/parse, using txs from latest block of columbus-5
* signed tx: encode to hex and send it
* unsigned tx: remove signatures and do same with signed tx

for construction/preprocess and construction/combine, randomly picked from predefined address will be used.

for data/drive, randomly created address will be used.

## how to run test
```
npm i  # only for first time
npm test
```


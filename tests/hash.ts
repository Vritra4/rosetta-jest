import * as superagent from 'superagent';
import common from '../common.json';

import { LCDClient, MnemonicKey, SimplePublicKey, hashToHex, sha256 } from '@terra-money/terra.js';
import { textSpanContainsPosition } from 'typescript';

const url = "http://54.177.167.213:8080/construction/hash";

const key = new MnemonicKey();
const pubkey = (key.publicKey as SimplePublicKey).toData().key

let param = {
    ...common,
    signed_transaction: "__signed_tx__"
}

const example = "0a8f010a8c010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126c0a2c74657272613178343672716179346433637373713867787876717a387874366e776c7a34746432306b333876122c746572726131376c6d616d367a6775617a7335713575367a356d6d783736756a3633676c646e7365327064701a0e0a05756c756e6112053330303030126a0a520a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b12040a02087f18cfd10112140a0e0a05756c756e611205333030303010c09a0c1a409cd7e78e729ce0570d54535a8204aa7c02d52403fcc30975b447cb38a0eb35e25fc1807066ad4a55ee9b616e93de4014021cfcc1f66c8e93364d4bcb3635f281"

jest.setTimeout(60 * 1000); // it needs very long timeout :(

describe("construction/hash", () => {
    it("common check", async () => {
        param.signed_transaction = example;
        const response = await superagent.post(url).send(param);
        expect(response.statusCode).toEqual(200);
    });


    it("validate hash from the latest block", async () => {

        const client = new LCDClient({ URL: "http://54.177.167.213:1317", chainID: "columbus-5" })
        const txs = await client.tx.txInfosByHeight(undefined);
        let count = 0;
        for (const tx of txs) {
            const txBytes = tx.tx.toBytes();
            const txHex = Buffer.from(txBytes).toString('hex');
            param.signed_transaction = txHex;
            //console.log(param);

            const response = await superagent.post(url).send(param);
            const body = JSON.parse(response.text);

            const calculated = Buffer.from(sha256(tx.tx.toBytes())).toString('hex').toUpperCase();
            expect(body.transaction_identifier.hash).toEqual(calculated);
            count++;


            if (count >= 100) {
                console.log(`hash test is done ${count} times. skip rest...`)
                break;
            }
        }
        expect(count).toBeGreaterThan(0);
    });
});

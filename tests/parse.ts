import * as superagent from 'superagent';
import common from '../common.json';

import { LCDClient, MnemonicKey, SimplePublicKey, hashToHex, sha256 } from '@terra-money/terra.js';
import { isTypeParameterDeclaration, textSpanContainsPosition } from 'typescript';

const url = "http://54.177.167.213:8090/construction/parse";

const key = new MnemonicKey();
const pubkey = (key.publicKey as SimplePublicKey).toData().key

const example = "0a8f010a8c010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126c0a2c74657272613178343672716179346433637373713867787876717a387874366e776c7a34746432306b333876122c746572726131376c6d616d367a6775617a7335713575367a356d6d783736756a3633676c646e7365327064701a0e0a05756c756e6112053330303030126a0a520a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b12040a02087f18cfd10112140a0e0a05756c756e611205333030303010c09a0c1a409cd7e78e729ce0570d54535a8204aa7c02d52403fcc30975b447cb38a0eb35e25fc1807066ad4a55ee9b616e93de4014021cfcc1f66c8e93364d4bcb3635f281"


jest.setTimeout(120 * 1000); // very long timeout

describe("construction/parse", () => {
    it("common check", async () => {
        let param = {
            ...common,
            signed: true,
            transaction: example
        }

        const response = await superagent.post(url).send(param);
        expect(response.statusCode).toEqual(200);
    });

    it("parse signed", async () => {
        let param = {
            ...common,
            signed: true,
            transaction: "__signed_tx__"
        }

        const client = new LCDClient({ URL: "http://54.177.167.213:1317", chainID: "columbus-5" })
        const blockinfo = await client.tendermint.blockInfo()

        const txs = blockinfo.block.data.txs;
        let count = 0;      // if block has no tx, assume it to fail
        for (const tx of txs!) {
            param.transaction = Buffer.from(tx, 'base64').toString('hex');

            const response = await superagent.post(url).send(param);
            const body = JSON.parse(response.text);
            count++;

            console.log(body);

            expect(body.operations.length).toBeGreaterThan(0) // have to have 1 or more operation(s)
            for (let i = 0; i < body.operations.length; i++) {
                expect(body.operations[i].operation_identifier.index).toBeGreaterThanOrEqual(0);
                expect(body.operations[i]).toHaveProperty("type");
                expect(body.operations[i]).toHaveProperty("metadata");
            }
            for (let i = 0; i < body.signers.length; i++) {
                expect(body.signers[i]).toEqual(body.account_identifier_signers[i].address)
            }

            // TODO: ADD MORE VALIDATIONS
        }
        expect(count).toBeGreaterThan(0);
    });

    it("parse unsigned", async () => {
        let param = {
            ...common,
            signed: false,
            transaction: "__signed_tx__"
        }

        const client = new LCDClient({ URL: "http://54.177.167.213:1317", chainID: "columbus-5" })
        const txs = await client.tx.txInfosByHeight(undefined);
        let count = 0;
        for (const tx of txs) {
            tx.tx.clearSignatures();  // remove signatures to make them unsigned
            const txBytes = tx.tx.toBytes();
            const txHex = Buffer.from(txBytes).toString('hex');
            param.transaction = txHex;

            const response = await superagent.post(url).send(param);
            const body = JSON.parse(response.text);
            count++;

            expect(body.operations.length).toBeGreaterThan(0) // have to have 1 or more operation(s)
            for (let i = 0; i < body.operations.length; i++) {
                expect(body.operations[i].operation_identifier.index).toBeGreaterThanOrEqual(0);
                expect(body.operations[i]).toHaveProperty("type");
                expect(body.operations[i].account).toHaveProperty("address");
                expect(body.operations[i]).toHaveProperty("metadata");
            }

            // TODO: ADD MORE VALIDATIONS
        }
        expect(count).toBeGreaterThan(0);
    });
});
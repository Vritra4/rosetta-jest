import * as superagent from 'superagent';
import common from '../common.json';

import { hashToHex, LCDClient, MnemonicKey, SimplePublicKey } from '@terra-money/terra.js';

const url = "http://54.177.167.213:8090/construction/derive";


let param = {
    ...common,
    public_key: {
        hex_bytes: "023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b",
        curve_type: "secp256k1"
    }
}
// A8Kvw8IVxMMdb/EcZl8BSrolxanQEfoJM0t0RwcA4mbr

describe("construction/derive", () => {
    it("common check", async () => {
        const response = await superagent.post(url).send(param);
        expect(response.statusCode).toEqual(200);
    });

    it("check derived address", async () => {
        const key = new MnemonicKey();
        const pubkey = key.publicKey! as SimplePublicKey;
        const hex_bytes = Buffer.from(pubkey.key, 'base64').toString('hex');
        console.log(`pubkey.key: |${pubkey.key}|`);
        console.log(`hex_bytes: |${hex_bytes}|${hex_bytes.length}|`)

        param.public_key.hex_bytes = hex_bytes

        const response = await superagent.post(url).send(param);
        const body = JSON.parse(response.text);

        expect(body.address).toEqual(key.accAddress);
        expect(body.account_identifier.address).toEqual(key.accAddress);
    });
});
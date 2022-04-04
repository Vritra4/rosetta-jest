import * as superagent from 'superagent';
import common from '../common.json';

import { LCDClient, MnemonicKey, SimplePublicKey, hashToHex, sha256, Msg, MsgSend, Coin } from '@terra-money/terra.js';
import { collapseTextChangeRangesAcrossMultipleVersions, isTypeParameterDeclaration, textSpanContainsPosition } from 'typescript';

const url = "http://54.177.167.213:8080/construction/preprocess";

const key = new MnemonicKey();
const pubkey = (key.publicKey as SimplePublicKey).toData().key

const example = "0a8f010a8c010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126c0a2c74657272613178343672716179346433637373713867787876717a387874366e776c7a34746432306b333876122c746572726131376c6d616d367a6775617a7335713575367a356d6d783736756a3633676c646e7365327064701a0e0a05756c756e6112053330303030126a0a520a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b12040a02087f18cfd10112140a0e0a05756c756e611205333030303010c09a0c1a409cd7e78e729ce0570d54535a8204aa7c02d52403fcc30975b447cb38a0eb35e25fc1807066ad4a55ee9b616e93de4014021cfcc1f66c8e93364d4bcb3635f281"

jest.setTimeout(60 * 1000);

describe("construction/preprocess", () => {
    it("common check", async () => {
        let param = `{"network_identifier":{"blockchain":"terra","network":"columbus-5"},"metadata":{"chain_id":"columbus-5","gas_limit":200000,"gas_price":"30000uluna","memo":""},"public_key":{"hex_bytes":"023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b","curve_type":"secp256k1"},"operations":[{"operation_identifier":{"index":0},"type":"/cosmos.bank.v1beta1.MsgSend","metadata":{"from_address":"terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v","to_address":"terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp","amount":[{"denom":"uluna","amount":"30000"}]}}]}`;
        const response = await superagent.post(url).send(param);
        expect(response.statusCode).toEqual(200);
    });

    it("preprocess validation", async () => {
        let param = {
            ...common,
            metadata: {
                chain_id: "columbus-5",
                gas_limit: 200000,
                gas_price: "0.15uluna",
                memo: ""
            },
            public_key: {
                hex_bytes: "",
                curve_type: "secp256k1",
            },
            operations: [] as any[],
        }

        const opNum = Math.floor(Math.random() * 7) + 1; // 1~8 operations

        for (let i = 0; i < opNum; i++) {
            const from = new MnemonicKey();
            const to = new MnemonicKey();
            const amount = new Coin('uluna', Math.floor(Math.random() * 120400));
            const operation = {
                operation_identifier: {
                    index: i
                },
                type: "/cosmos.bank.v1beta1.MsgSend",
                metadata: {
                    from_address: from.accAddress,
                    to_address: to.accAddress,
                    amount: [
                        {
                            denom: amount.denom,
                            amount: amount.amount
                        }
                    ]
                }
            }
            param.operations.push(operation);
        }
        //console.log(JSON.stringify(param));
        const response = await superagent.post(url).send(param);
        const body = JSON.parse(response.text);
        //console.log(body);
        for (let i = 0; i < opNum; i++) {
            expect(param.operations[i].metadata.from_address).toEqual(body.options.expected_signers[i])
            expect(param.operations[i].metadata.from_address).toEqual(body.required_public_keys[i].address)
        }
    });
});

import * as superagent from 'superagent';
import common from '../common.json';

import { LCDClient, MnemonicKey, SimplePublicKey, hashToHex, sha256, Msg, MsgSend, Coin } from '@terra-money/terra.js';
import { isTypeParameterDeclaration, textSpanContainsPosition } from 'typescript';

const url = "http://54.177.167.213:8080/construction/payloads";

const LOCALTERRA_MNEMONICS = [
    'satisfy adjust timber high purchase tuition stool faith fine install that you unaware feed domain license impose boss human eager hat rent enjoy dawn',
    'notice oak worry limit wrap speak medal online prefer cluster roof addict wrist behave treat actual wasp year salad speed social layer crew genius',
    'quality vacuum heart guard buzz spike sight swarm shove special gym robust assume sudden deposit grid alcohol choice devote leader tilt noodle tide penalty',
    //'symbol force gallery make bulk round subway violin worry mixture penalty kingdom boring survey tool fringe patrol sausage hard admit remember broken alien absorb',
    //'bounce success option birth apple portion aunt rural episode solution hockey pencil lend session cause hedgehog slender journey system canvas decorate razor catch empty',
    //'second render cat sing soup reward cluster island bench diet lumber grocery repeat balcony perfect diesel stumble piano distance caught occur example ozone loyal',
    //'spatial forest elevator battle also spoon fun skirt flight initial nasty transfer glory palm drama gossip remove fan joke shove label dune debate quick',
    'noble width taxi input there patrol clown public spell aunt wish punch moment will misery eight excess arena pen turtle minimum grain vague inmate',
    //'cream sport mango believe inhale text fish rely elegant below earth april wall rug ritual blossom cherry detail length blind digital proof identify ride',
    //'index light average senior silent limit usual local involve delay update rack cause inmate wall render magnet common feature laundry exact casual resource hundred',
    'prefer forget visit mistake mixture feel eyebrow autumn shop pair address airport diesel street pass vague innocent poem method awful require hurry unhappy shoulder',
];

jest.setTimeout(30 * 1000);

describe("construction/payloads", () => {
    it("common check", async () => {
        let param = `{"network_identifier":{"blockchain":"terra","network":"columbus-5"},"operations":[{"operation_identifier":{"index":0},"account":{"address":"terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v"},"type":"/cosmos.bank.v1beta1.MsgSend","metadata":{"from_address":"terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v","to_address":"terra17lmam6zguazs5q5u6z5mmx76uj63gldnse2pdp","amount":[{"denom":"uluna","amount":"30000"}]}}],"public_keys":[{"hex_bytes":"023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b","curve_type":"secp256k1"}],"metadata":{"chain_id":"columbus-5","gas_limit":200000,"gas_price":"30000uluna","memo":"","signer_data":[{"account_number":1165,"sequence":26831}]}}`;
        const response = await superagent.post(url).send(param);
        expect(response.statusCode).toEqual(200);
    });

    it("validate payload", async () => {
        let param = {
            ...common,
            operations: [] as any[],
            public_keys: [] as any[],
            metadata: {
                chain_id: "columbus-5",
                gas_limit: 200000,
                gas_price: "0.15uluna",
                memo: "",
                signer_data: [] as any[]
            },
        }
        const client = new LCDClient({ URL: "http://54.177.167.213:1317", chainID: "columbus-5" })

        const opNum = Math.floor(Math.random() * 1) + 1; // 1~2 operations

        const from_seed = LOCALTERRA_MNEMONICS[Math.floor(Math.random() * LOCALTERRA_MNEMONICS.length)];
        const from = new MnemonicKey({ mnemonic: from_seed });
        const pubkey = from.publicKey! as SimplePublicKey;
        const hex_bytes = Buffer.from(pubkey.key, 'base64').toString('hex');
        const public_key = {
            hex_bytes,
            curve_type: "secp256k1"
        };
        param.public_keys.push(public_key);

        const accountInfo = await client.auth.accountInfo(from.accAddress);
        //console.log(accountInfo);
        const signer_data = {
            account_number: accountInfo.getAccountNumber(),
            sequence: accountInfo.getSequenceNumber()
        };
        param.metadata.signer_data.push(signer_data)

        for (let i = 0; i < opNum; i++) {
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

        expect(body).toHaveProperty("unsigned_transaction");
        for (let i = 0; i < opNum; i++) {
            //console.log(`payload idx:${i}`);
            expect(body.payloads[i].address).toEqual(from.accAddress);
            expect(body.payloads[i].account_identifier.address).toEqual(from.accAddress);
        }

        // TODO: ADD MORE VALIDATIONS
    });
});

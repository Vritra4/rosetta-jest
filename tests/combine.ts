import * as superagent from 'superagent';
import common from '../common.json';
import { SignMode } from '@terra-money/terra.proto/cosmos/tx/signing/v1beta1/signing';
import { LCDClient, MnemonicKey, SimplePublicKey, hashToHex, sha256, ParamChanges, Coin, MsgSend, Fee, Tx, SignDoc, SignerInfo, ModeInfo } from '@terra-money/terra.js';
import { isTypeParameterDeclaration, textSpanContainsPosition } from 'typescript';

const url = "http://54.177.167.213:8090/construction/combine";

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

let param = {
    ...common,
    unsigned_transaction: "__unsigned_tx__",
    signatures: [] as any[],
    metadata: {
        chain_id: "columbus-5",
        gas_limit: 200000,
        gas_price: "0.2uluna",
        memo: "",
        signer_data: [] as any[],
    }
}

describe("construction/combine", () => {
    it("common check", async () => {
        let param = `{"network_identifier":{"blockchain":"terra","network":"columbus-5"},"unsigned_transaction":"0a8f010a8c010a1c2f636f736d6f732e62616e6b2e763162657461312e4d736753656e64126c0a2c74657272613178343672716179346433637373713867787876717a387874366e776c7a34746432306b333876122c746572726131376c6d616d367a6775617a7335713575367a356d6d783736756a3633676c646e7365327064701a0e0a05756c756e611205333030303012680a500a460a1f2f636f736d6f732e63727970746f2e736563703235366b312e5075624b657912230a21023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b12020a0018cfd10112140a0e0a05756c756e611205333030303010c09a0c1a00","signatures":[{"signing_payload":{"account_identifier":{"address":"terra1x46rqay4d3cssq8gxxvqz8xt6nwlz4td20k38v"},"hex_bytes":"abcd5eb84c2c0d887af300c79c58ee535fd43cd155e17496c749b1b222689f70","signature_type":"ecdsa"},"public_key":{"hex_bytes":"023b33a8524344061b12364cba20fe0a1ab36d4486abf451bb7cebd11ea2241e5b","curve_type":"secp256k1"},"signature_type":"ecdsa","hex_bytes":"9cd7e78e729ce0570d54535a8204aa7c02d52403fcc30975b447cb38a0eb35e25fc1807066ad4a55ee9b616e93de4014021cfcc1f66c8e93364d4bcb3635f281"}],"metadata":{"chain_id":"columbus-5","gas_limit":200000,"gas_price":"1000uluna","memo":"","signer_data":[{"account_number":1165,"sequence":26831}]}}`;
        const response = await superagent.post(url).send(param);
        expect(response.statusCode).toEqual(200);
    });

    it("combine unsigned tx and its signature", async () => {

        const client = new LCDClient({ URL: "http://54.177.167.213:1317", chainID: "columbus-5", gasAdjustment: 0.01, gasPrices: "0.001uluna" })

        const from_seed = LOCALTERRA_MNEMONICS[Math.floor(Math.random() * LOCALTERRA_MNEMONICS.length)];
        const from = new MnemonicKey({ mnemonic: from_seed });
        const accountInfo = await client.auth.accountInfo(from.accAddress);
        const signer_data = {
            account_number: accountInfo.getAccountNumber(),
            sequence: accountInfo.getSequenceNumber()
        };
        param.metadata.signer_data.push(signer_data)

        const to = new MnemonicKey();
        //const amount = new Coin('uluna', Math.floor(Math.random() * 120400));
        const amount = new Coin('uluna', 1);

        const msg = new MsgSend(from.accAddress, to.accAddress, amount.toString());
        const unsigned_tx = await client.tx.create([{ address: from.accAddress }], { msgs: [msg], fee: new Fee(200000, "2000uluna") })
        param.unsigned_transaction = Buffer.from(unsigned_tx.toBytes()).toString('hex');

        const pubkey = from.publicKey! as SimplePublicKey;
        const hex_bytes = Buffer.from(pubkey.key, 'base64').toString('hex');
        const public_key = {
            hex_bytes,
            curve_type: "secp256k1"
        };

        //const payload_hex_bytes = createTxHash(unsigned_tx, from.publicKey! as SimplePublicKey, signer_data.account_number, signer_data.sequence);
        const payload_hex_bytes = await getPayloadsHexBytes(from, to, amount)
        const signed_tx = await from.signTx(unsigned_tx, {
            chainID: "columbus-5",
            sequence: accountInfo.getSequenceNumber(),
            accountNumber: accountInfo.getAccountNumber(),
            signMode: SignMode.SIGN_MODE_LEGACY_AMINO_JSON,
        });

        const signature_hex_bytes = Buffer.from(signed_tx.signatures[0], "base64").toString("hex");
        const signature = {
            signing_payload: {
                account_identifier: {
                    address: from.accAddress
                },
                hex_bytes: payload_hex_bytes,
                signature_type: "ecdsa"
            },
            public_key,
            signature_type: "ecdsa",
            hex_bytes: signature_hex_bytes
        }
        param.signatures.push(signature);

        console.log(JSON.stringify(param));
        const response = await superagent.post(url).send(param);
        const body = JSON.parse(response.text);
        console.log(body);
    });
});

/*
function createTxHash(tx: Tx, pubKey: SimplePublicKey, account_number: number, sequence: number): string {
    const signDoc = new SignDoc(
        "columbus-5", account_number, sequence,
        tx.auth_info, tx.body
    )
    // backup for restore
    const signerInfos = signDoc.auth_info.signer_infos;
    signDoc.auth_info.signer_infos = [
        new SignerInfo(
            pubKey,
            signDoc.sequence,
            new ModeInfo(new ModeInfo.Single(SignMode.SIGN_MODE_DIRECT))
        ),
    ];

    return Buffer.from(sha256(Buffer.from(signDoc.toBytes()))).toString('hex');
}
*/

async function getPayloadsHexBytes(from: MnemonicKey, to: MnemonicKey, amount: Coin): Promise<string> {
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

    const opNum = Math.floor(Math.random() * 3) + 1; // 1~4 operations

    const pubkey = from.publicKey! as SimplePublicKey;
    const hex_bytes = Buffer.from(pubkey.key, 'base64').toString('hex');
    const public_key = {
        hex_bytes,
        curve_type: "secp256k1"
    };
    param.public_keys.push(public_key);

    const accountInfo = await client.auth.accountInfo(from.accAddress);
    const signer_data = {
        account_number: accountInfo.getAccountNumber(),
        sequence: accountInfo.getSequenceNumber()
    };
    param.metadata.signer_data.push(signer_data)

    const operation = {
        operation_identifier: {
            index: 0
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
    const response = await superagent.post("http://54.177.167.213:8090/construction/payloads").send(param);
    const body = JSON.parse(response.text);
    console.log(`HEX_BYTES: ${body.payloads[0].hex_bytes}`);
    return body.payloads[0].hex_bytes
}
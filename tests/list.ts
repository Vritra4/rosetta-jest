import * as superagent from 'superagent';
import common from '../common.json';

const url = "http://54.177.167.213:8090/network/list"


describe("network/list", () => {
    it("common check", async () => {
        const response = await superagent.post(url).send({});
        expect(response.statusCode).toEqual(200);
    });

    it("check network identifiers", async () => {
        const response = await superagent.post(url).send({});

        const body = JSON.parse(response.text);

        expect(body.network_identifiers).toHaveLength(1);
        expect(body.network_identifiers[0].blockchain).toEqual(common.network_identifier.blockchain);
        expect(body.network_identifiers[0].network).toEqual(common.network_identifier.network);
    });
});
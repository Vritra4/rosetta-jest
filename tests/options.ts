import * as superagent from 'superagent';
import common from '../common.json';

const url = "http://54.177.167.213:8080/network/options"


describe("network/options", () => {

    it("check version", async () => {
        const response = await superagent.post(url).send(common);
        expect(response.statusCode).toEqual(200);

        const body = JSON.parse(response.text);

        // check version
        expect(body.version).toHaveProperty("rosetta_version");
        expect(body.version).toHaveProperty("node_version");

    });

    it("check allow", async () => {
        const response = await superagent.post(url).send(common);
        expect(response.statusCode).toEqual(200);

        const body = JSON.parse(response.text);
        const allow = body.allow;

        // check operation statuses
        const success = allow.operation_statuses[0];
        const reverted = allow.operation_statuses[1];
        expect(success.status).toEqual("Success");
        expect(success.successful).toBeTruthy();
        expect(reverted.status).toEqual("Reverted");
        expect(reverted.successful).toBeFalsy();

        // check operation types
        allow.operation_types.forEach((optype: any) => {
            // type check
            expect(typeof optype).toEqual("string");
            // starts with /, coin_spent, coin_received or burn
            expect(optype).toMatch(/^.*(\/|coin_spent|coin_received|burn)/);
        });

        const errors = allow.errors;

        errors.forEach((e: any) => {
            // err must be greater than or equal to 0
            expect(e.code).toBeGreaterThanOrEqual(0);
            // just type check
            expect(typeof e.message).toEqual("string");
            expect(typeof e.description).toEqual("string");
            expect(typeof e.retriable).toEqual("boolean")
        });

        expect(typeof allow.historical_balance_lookup).toEqual("boolean");
        expect(allow.timestamp_start_index).toBeUndefined(); // offline nodes returns nothing
        expect(allow.call_methos).toBeUndefined();
        expect(allow.balance_exemptions).toBeNull();
        expect(allow.mempool_coins).toBeFalsy();
    });
});

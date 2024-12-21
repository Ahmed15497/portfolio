'use strict';

const { Contract } = require('fabric-contract-api');

class Cars extends Contract {

    async initLedger(ctx) {
        console.info('Ledger initialized');
    }

    async queryCar(ctx, id) {
        const itemAsBytes = await ctx.stub.getState(id);
        if (!itemAsBytes || itemAsBytes.length === 0) {
            //throw new Error(`Item ${id} does not exist`);
            return 0;
        }
        return itemAsBytes.toString();
    }

    async createCar(ctx, id, userId,
                    name, year, status,
                    publicKey, registerDate,
                    emergancyFlag, messageDate
        ) {

        // emergancyFlag  0=>no emergance, 1=>emergancy
        
        const car = {
            id, userId,
            name, year, status,
            publicKey, registerDate,
            emergancyFlag, messageDate
            }; 


        await ctx.stub.putState(id, Buffer.from(JSON.stringify(car)));
    }

    async queryByAttributeAndMaxDate(ctx, filterAttribute, filterValue, date_column, limit_count) {
        const sortField = {};
        sortField[date_column] = "desc";  // Create dynamic sort object for descending order
        
        const query = {
            "selector": {
                [filterAttribute]: filterValue
            },
            "sort": [
                sortField  // Use dynamically created sort field, no "desc" in the index
            ],
            "limit": parseInt(limit_count)  // Ensure limit is an integer
        };
    
        const queryString = JSON.stringify(query);
    
        // Get query result from CouchDB
        const resultIterator = await ctx.stub.getQueryResult(queryString);
    
        const result = await this.getAllResults(resultIterator);
    
        // Return the latest document
        return JSON.stringify(result);
    }

    
    // Helper function to get all results from iterator
    async getAllResults(iterator) {
        const allResults = [];
        while (true) {
            const res = await iterator.next();
            if (res.value && res.value.value.toString()) {
                let jsonRes = {};
                try {
                    jsonRes = JSON.parse(res.value.value.toString('utf8'));
                } catch (err) {
                    console.log(err);
                    jsonRes = res.value.value.toString('utf8');
                }
                allResults.push(jsonRes);
            }
            if (res.done) {
                await iterator.close();
                return allResults;
            }
        }
    }


}

module.exports = Cars;

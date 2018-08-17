const Promise = require('bluebird');
const GoogleDataStore = require('./DataStore');
const _ = require('lodash');
const assert = require('assert');

const streamId = 'stream-' + Math.floor(100000000 * Math.random());

describe('When a scan operation is limited', function() {
    let googleDataStore;
    const recordsToInsert = 5;
    const artifacts = [];
    const config = {
        projectId: process.env.GOOGLE_DS_PROJECT_ID,
        keyFilename: process.env.GOOGLE_DS_KEY_FILENAME
    };

    for (let i = 0; i < recordsToInsert; i++) {
        artifacts.push({
            streamId: streamId,
            artifactId: 'artifact-' + _.random(0, 1000000000)
        });
    }

    this.timeout(15000);

    before(() => {
        googleDataStore = new GoogleDataStore(config, 'platform-tests', 'artifact');
    });

    beforeEach((done) => {
        Promise.map(artifacts, (artifact) => {
            return googleDataStore.save([{key: artifact.artifactId, data: artifact}], {indexes: {streamId: true}});
        }).then(() => done());
    });

    afterEach((done) => {
        Promise.map(artifacts, (artifact) => {
            return googleDataStore.remove([artifact.artifactId]);
        }).then(() => done())
    });

    it('scans all records when limit is higher', () => {
        const scannedRecords = [];
        const dataCallback = (record) => {
            console.log('SCANNED', record)
            scannedRecords.push(record);
        };

        console.log('SCAN ALL')

        return googleDataStore.query({streamId: streamId}, {dataCallback}).then(() => {
            console.log('CHECK ALL')

            assert(scannedRecords.length === artifacts.length);
        });
    });
});
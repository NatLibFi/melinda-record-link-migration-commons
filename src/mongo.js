import {MongoClient} from 'mongodb';
import {Error as ApiError, Utils} from '@natlibfi/melinda-commons';
import moment from 'moment';

/* JobItem:
{
  "jobId": "FOO"
  "jobState":"PENDING_SRU_HARVESTER",
  "jobConfig": {
    hostRecord: MarcRecord,
    apiHarvesterProfileId: 'viola-aut-migration',
    search: {
      from: {tag: '100', value: {code: 'a'}},
      query: `dc.author=${0}`,
      resumptionToken: {"_": "FOO", "$":{"expirationDate":"2020-01-01T00:00:01.000+02:00","cursor":"0"}},
      url: 'https://sru.api.melinda-test.kansalliskirjasto.fi/bib'
    },
    linkDataSearchValidationFilter: {
      subfieldExclusion: [{tag: /^100$/u, subfields: [{code: /0/u}]}]
    },
    changes: [{
      from: {tag: '001', value: "value"},
      to: {tag: '100', value: {code: '0'}, format: `(FIN11)${0}`}
    }]
  },
  "creationTime":"2020-01-01T00:00:00.000Z",
  "modificationTime":"2020-01-01T00:00:01.000Z",
}
*/

export default async function (mongoUrl) {
  const {createLogger, logError} = Utils;
  const logger = createLogger();
  // Connect to mongo (MONGO)
  const client = await MongoClient.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
  const db = client.db('linkker');

  return {create, query, remove, getOne, setState, updateResumptionToken, pushBlobIds};

  function create({jobId, jobState, jobConfig}) {
    if (jobState === undefined || jobConfig === undefined) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(400, 'Invalid job settings!');
    }
    // Create JobItem
    const newJobItem = {
      jobId,
      jobState,
      jobConfig,
      creationTime: moment().toDate(),
      modificationTime: moment().toDate()
    };
    try {
      db.collection('job-items').insertOne(newJobItem);
      logger.log('info', 'New jobItem has been made!');
      return db.collection('job-items').findOne({jobId}, {projection: {_id: 0}});
    } catch (error) {
      logError(error);
      throw new ApiError(500, 'Error while creating job item');
    }
  }

  async function query(params) {
    const result = await db.collection('job-items').find(params, {projection: {_id: 0}}).toArray();
    logger.log('debug', `Query result: ${result.length > 0 ? 'Found!' : 'Not found!'}`);
    return result;
  }

  async function remove(params) {
    await db.collection('job-items').deleteOne(params);
    return true;
  }

  function getOne(jobState) {
    try {
      logger.log('debug', `Checking DB for ${jobState}`);
      return db.collection('job-items').findOne({jobState});
    } catch (error) {
      logError(error);
    }
  }

  async function setState({jobId, state}) {
    logger.log('info', `Setting jobItem state: ${jobId}, ${state}`);
    const result = await db.collection('job-items').findOneAndUpdate({
      jobId
    }, {
      $set: {
        jobState: state,
        modificationTime: moment().toDate()
      }
    }, {projection: {_id: 0}, returnNewDocument: true});
    return result.value;
  }

  async function updateResumptionToken({jobId, resumptionToken}) {
    logger.log('info', `Setting jobItem resumptionToken: ${jobId}, ${resumptionToken}`);
    const result = await db.collection('job-items').findOneAndUpdate({
      jobId
    }, {
      $set: {
        jobConfig: {resumptionToken: resumptionToken},
        modificationTime: moment().toDate()
      }
    }, {projection: {_id: 0}, returnNewDocument: true});
    return result.value;
  }

  async function pushBlobIds({jobId, blobIds}) {
    logger.log('debug', `Push jobItem ${jobId} blobIds list: ${blobIds}`);
    await db.collection('queue-items').updateOne({
      jobId
    }, {
      $set: {
        modificationTime: moment().toDate()
      },
      $push: {
        "jobConfig.blobIds": {$each: blobIds}
      }
    });
  }
}

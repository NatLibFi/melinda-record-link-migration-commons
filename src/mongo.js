import {MongoClient, Logger} from 'mongodb';
import {Error as ApiError, Utils} from '@natlibfi/melinda-commons';
import {logError} from './utils.js';
import moment from 'moment';
import {JOB_STATES} from './constants';

/* JobItem:
{
    "jobId": "FOO"
    "jobState":"IN_QUEUE",
    "jobConfig": {
        "oai_pmh_root": "bib",
        "oai_pmh_format": "melinda_marc",
        "tags": ["100", "110", "350"],
		"ids": ["000015418", "002015419", "010015420", "000215421", "010015422", "008015423", "000915424", "000015425", "003015426", "010215427"],
        "fromTo": {"start": 15408, "end": 15448}
		"startFrom": 000015500,
		resumptionToken: {"_": "FOO", "$":{"expirationDate":"2020-01-01T00:00:01.000+02:00","cursor":"0"}}
    },
    "creationTime":"2020-01-01T00:00:00.000Z",
    "modificationTime":"2020-01-01T00:00:01.000Z",
}
*/

export default async function (MONGO_URI) {
	const {createLogger} = Utils;
	const logger = createLogger();
	const mongoLogger = Logger;
	mongoLogger.setLevel('debug');
	mongoLogger.setCurrentLogger((msg, context) => {
		logger.log('debug', msg);
		logger.log('debug', context);
	});
	// Connect to mongo (MONGO)
	const client = await MongoClient.connect(MONGO_URI, {useNewUrlParser: true, useUnifiedTopology: true, logger: mongoLogger});
	const db = client.db('rest-api');

	return {create, query, remove, getOne, setState, updateResumptionToken};

	async function create({jobId, jobConfig}) {
		// Create JobItem
		const newJobItem = {
			jobId,
			jobState: JOB_STATES.IN_QUEUE,
			jobConfig,
			creationTime: moment().toDate(),
			modificationTime: moment().toDate()
		};
		try {
			db.collection('job-items').insertOne(newJobItem);
			logger.log('info', 'New job item has been made!');
			return db.collection('job-items').findOne({jobId}, {projection: {_id: 0}});
		} catch (error) {
			logError(error);
			throw new ApiError(500);
		}
	}

	async function query(params) {
		const result = await db.collection('job-items').find(params, {projection: {_id: 0}}).toArray();
		logger.log('debug', `Query result: ${(result.length > 0) ? 'Found!' : 'Not found!'}`);
		return result;
	}

	async function remove(params) {
		await db.collection('job-items').deleteOne(params);
		return true;
	}

	async function getOne(jobState) {
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
				'jobConfig.resumptionToken': resumptionToken,
				modificationTime: moment().toDate()
			}
		}, {projection: {_id: 0}, returnNewDocument: true});
		return result.value;
	}
}

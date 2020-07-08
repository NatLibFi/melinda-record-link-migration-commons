/* eslint-disable no-unused-vars, */

import {Utils} from '@natlibfi/melinda-commons';
import {BLOB_STATE, createApiClient} from '@natlibfi/melinda-record-import-commons';

export default function ({apiUrl, apiUsername, apiPassword, apiClientUserAgent, apiHarvesterProfileId}) {
  const {createLogger} = Utils;
  const logger = createLogger();
  logger.log('verbose', 'Connecting to erätuonti');
  const client = createApiClient({
    url: apiUrl, username: apiUsername, password: apiPassword,
    userAgent: apiClientUserAgent
  });

  return {sendBlob};

  // Send record to transformer
  async function sendBlob(data) {
    const blob = JSON.stringify(data);
    logger.log('silly', blob);
    logger.log('info', 'Data sending to Erätuonti service has begun!');
    if (blob) {
      logger.log('info', 'Trying to create  blob');
      // Record-import-commons: async function createBlob({blob, type, profile})
      const response = await client.createBlob({blob, type: 'application/json', profile: apiHarvesterProfileId});
      logger.log('debug', 'Got response');
      // Return blobId to be saved in jobItem
      return response;
      // TRANSFORMER picks it from QUEUE
    }

    return false;
  }
}

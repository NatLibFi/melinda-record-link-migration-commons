/* eslint-disable no-unused-vars, */

import {Utils} from '@natlibfi/melinda-commons';
import {createApiClient} from '@natlibfi/melinda-record-import-commons';

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
  async function sendBlob({hostRecord, changes, valids}) {
    const linkedData = valids.map(record => {hostRecord, changes, record});
    const blob = JSON.stringify(linkedData);
    const type = 'application/json';
    const profile = apiHarvesterProfileId;
    logger.log('debug', profile);
    logger.log('debug', type);
    logger.log('debug', blob);
    logger.log('info', 'Data sending to Erätuonti service has begun!');
    if (blob) {
      try {
        logger.log('info', 'Trying to create blob');
        // Record-import-commons: async function createBlob({blob (data), type (constent-type), profile (import profile)})
        const response = await client.createBlob({blob, type, profile});
        logger.log('debug', 'Got response');
        // Return blobId to be saved in jobItem
        return response;
        // TRANSFORMER picks it from QUEUE
      } catch (error) {
        logger.log('error', error);
      }
    }

    return false;
  }
}

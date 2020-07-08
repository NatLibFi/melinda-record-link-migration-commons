/* eslint-disable no-unused-vars, */

import {Utils} from '@natlibfi/melinda-commons';
import {BLOB_STATE, createApiClient} from '@natlibfi/melinda-record-import-commons';

export default function ({API_URL, API_USERNAME, API_PASSWORD, API_CLIENT_USER_AGENT, API_HARVERSTER_PROFILE_ID}) {
  const {createLogger} = Utils;
  const logger = createLogger();
  logger.log('verbose', 'Connecting to erätuonti');
  const client = createApiClient({
    url: API_URL, username: API_USERNAME, password: API_PASSWORD,
    userAgent: API_CLIENT_USER_AGENT
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
      const response = await client.createBlob({blob, type: 'application/json', profile: API_HARVERSTER_PROFILE_ID});
      logger.log('debug', 'Got response');
      // Return blobId to be saved in jobItem
      return response;
      // TRANSFORMER picks it from QUEUE
    }

    return false;
  }
}

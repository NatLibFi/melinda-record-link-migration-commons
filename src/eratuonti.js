/* eslint-disable no-unused-vars, */

import {Error as ApiError} from '@natlibfi/melinda-commons';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {createApiClient} from '@natlibfi/melinda-record-import-commons';
import {logError} from './utils';
import {EventEmitter} from 'events';
import {on} from 'process';

export default function ({apiUrl, apiUsername, apiPassword, apiClientUserAgent}) {
  const logger = createLogger();
  logger.log('verbose', 'Connecting to erätuonti');
  const client = createApiClient({
    url: apiUrl, username: apiUsername, password: apiPassword,
    userAgent: apiClientUserAgent
  });

  return {sendBlob, readBlob, updateBlobState, countBlobs};

  // Send record to transformer
  async function sendBlob(linkedValids, profile) {
    if (linkedValids === undefined) { // eslint-disable-line functional/no-conditional-statement
      throw new ApiError(400, 'Valid linked data missing!');
    }
    const blob = JSON.stringify(linkedValids);
    const type = 'application/json';
    // logger.log('debug', profile);
    // logger.log('debug', type);
    // logger.log('debug', blob);
    logger.log('info', 'Data sending to Erätuonti service has begun!');

    try {
      logger.log('info', 'Trying to create blob');
      // Record-import-commons: async function createBlob({blob (data), type (constent-type), profile (import profile)})
      const response = await client.createBlob({blob, type, profile});
      logger.log('debug', 'Got response');
      // Return blobId to be saved in jobItem
      return response;
      // TRANSFORMER picks it from QUEUE
    } catch (error) {
      logger.log('error', 'Error while sending blob to erätuonti!');
      logError(error);
      return false;
    }
  }

  async function readBlob(id) {
    try {
      const result = await client.getBlobMetadata({id});
      // logger.log('debug', JSON.stringify(result));
      return result;
    } catch (error) {
      logger.log('error', 'Error while reading blob from erätuonti!');
      logError(error);
      return false;
    }
  }

  async function updateBlobState(id, state) {
    try {
      const result = await client.updateState({id, state});
      // logger.log('debug', JSON.stringify(result));
      return result;
    } catch (error) {
      logger.log('error', 'Error while updating blob state to erätuonti!');
      logError(error);
      return false;
    }
  }

  function countBlobs(state) {
    try {
      return new Promise((resolve, reject) => {
        let count = 0; // eslint-disable-line
        const emitter = client.getBlobs({state});

        emitter
          .on('error', reject)
          .on('blobs', blobs => {
            count += blobs.length;
          })
          .on('end', () => {
            console.log(count); // eslint-disable-line
            resolve(count);
          });
      });
    } catch (error) {
      logger.log('error', `Error while counting blobs in state: ${state}!`);
      logError(error);
      return false;
    }
  }
}

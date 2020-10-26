/**
*
* @licstart  The following is the entire license notice for the JavaScript code in this file.
*
* Shared modules for microservices of Melinda rest api batch import system
*
* Copyright (C) 2020 University Of Helsinki (The National Library Of Finland)
*
* This file is part of melinda-rest-api-commons
*
* melinda-rest-api-commons program is free software: you can redistribute it and/or modify
* it under the terms of the GNU Affero General Public License as
* published by the Free Software Foundation, either version 3 of the
* License, or (at your option) any later version.
*
* melinda-rest-api-commons is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU Affero General Public License for more details.
*
* You should have received a copy of the GNU Affero General Public License
* along with this program.  If not, see <http://www.gnu.org/licenses/>.
*
* @licend  The above is the entire license notice
* for the JavaScript code in this file.
*
*/

import amqplib from 'amqplib';
import {MarcRecord} from '@natlibfi/marc-record';
import {Error as ApiError} from '@natlibfi/melinda-commons';
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {logError} from './utils';

export default async function (AMQP_URL) {
  const logger = createLogger();
  const connection = await amqplib.connect(AMQP_URL);
  const channel = await connection.createChannel();

  return {checkQueue, consume, consumeOne, messagesToRecords, ackNReplyMessages, ackMessages, nackMessages, sendToQueue, removeQueue};

  async function checkQueue(queue, style = 'basic', purge = false) {
    try {
      const channelInfo = await channel.assertQueue(queue, {durable: true, autoDelete: true});
      logger.log('debug', `Queue ${queue} has ${channelInfo.messageCount} records`);

      await purgeQueue(purge);

      if (channelInfo.messageCount < 1) {
        return false;
      }

      if (style === 'messages') {
        return channelInfo.messageCount;
      }

      if (style === 'basic') {
        return consume(queue);
      }

      if (style === 'one') {
        return consumeOne(queue);
      }

      // Defaults:
      throw new ApiError(422);
    } catch (error) {
      logError(error);
    }

    function purgeQueue(purge) {
      if (purge) {
        return channel.purgeQueue(queue);
      }
    }
  }

  async function consume(queue) {
    // Debug: logger.log('debug', `Prepared to consume from queue: ${queue}`);
    try {
      await channel.assertQueue(queue, {durable: true, autoDelete: true});
      const queMessages = await getData(queue);
      return queMessages;
    } catch (error) {
      logError(error);
    }
  }

  async function consumeOne(queue) {
    try {
      await channel.assertQueue(queue, {durable: true, autoDelete: true});
      // Returns false if 0 items in queue
      return await channel.get(queue);
    } catch (error) {
      logError(error);
    }
  }

  // ACK records
  function ackNReplyMessages({status, messages, payloads}) {
    logger.log('debug', 'Ack and reply messages!');
    messages.forEach((message, index) => {
      // Reply consumer gets: {"data":{"status":"UPDATED","payload":"0"}}
      sendToQueue({
        queue: message.properties.correlationId,
        correlationId: message.properties.correlationId,
        data: {
          status, payload: payloads[index]
        }
      });

      channel.ack(message);
    });
  }

  function ackMessages(messages) {
    logger.log('debug', 'Ack messages!');
    messages.forEach(message => {
      channel.ack(message);
    });
  }

  function nackMessages(messages) {
    logger.log('debug', 'Nack messages!');
    messages.forEach(message => {
      // Message, allUpTo, reQueue
      channel.reject(message, true);
    });
  }

  async function sendToQueue({queue, correlationId, data}) {
    try {
      // Logger.log('debug', `Record queue ${queue}`)
      // Logger.log('debug', `Record correlationId ${correlationId}`);
      // Logger.log('debug', `Record data ${data}`);

      await channel.assertQueue(queue, {durable: true, autoDelete: true});

      channel.sendToQueue(
        queue,
        Buffer.from(JSON.stringify(data)),
        {
          correlationId,
          persistent: true
        }
      );

      // Spams: logger.log('debug', `Message send to queue ${queue}`);
    } catch (error) {
      logError(error);
    }
  }

  async function removeQueue(queue) {
    await channel.deleteQueue(queue);
  }

  // ----------------
  // Helper functions
  // ----------------

  function messagesToRecords(messages) {
    logger.log('debug', 'Parsing messages to records');

    return messages.map(message => {
      // Logger.log('debug', 'Message => record');
      const content = JSON.parse(message.content.toString());
      return new MarcRecord(content, {subfieldValues: false});
    });
  }

  async function getData(queue) {
    logger.log('verbose', `Getting queue data from ${queue}`);

    try {
      const {messageCount} = await channel.checkQueue(queue);
      const messagesToGet = messageCount >= 50 ? 50 : messageCount;

      const messages = await pump(messagesToGet);

      logger.log('debug', `Returning ${messages.length} unique messages`);

      return messages;
    } catch (error) {
      logError(error);
    }

    async function pump(count, results = [], identifiers = []) {
      if (count === 0) {
        return results;
      }

      const message = await channel.get(queue);
      const identifier = {
        correlationId: message.properties.correlationId,
        deliveryTag: message.fields.deliveryTag
      };
      // Filter not unique messages
      if (identifiers.includes(identifier)) {
        return pump(count - 1, results, identifiers);
      }

      return pump(count - 1, results.concat(message), identifiers.concat(identifier));
    }
  }
}

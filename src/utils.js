import {createLogger} from '@natlibfi/melinda-backend-commons';
import {Error as CommonsError} from '@natlibfi/melinda-commons';
const logger = createLogger();

export function sortSubfields(order, subfields, orderedSubfields = []) {
  const [filter, ...rest] = order;
  if (filter === undefined) {
    return [...orderedSubfields, ...subfields];
  }

  logger.log('silly', '************************************************************');
  logger.log('silly', `Subfield sort filter: ${JSON.stringify(filter)}`);
  logger.log('silly', `Subfields: ${JSON.stringify(subfields)}`);
  logger.log('silly', `Ordered subfields: ${JSON.stringify(orderedSubfields)}`);

  const filtered = subfields.filter(sub => {
    if (typeof filter === 'string') {
      return sub.code === filter;
    }

    return sub.code === filter.code && new RegExp(filter.value, 'u').test(sub.value);
  });

  logger.log('silly', `Filtered subfields: ${JSON.stringify(filtered)}`);

  const restSubfields = subfields.filter(sub => {
    if (typeof filter === 'string') {
      return sub.code !== filter;
    }

    return sub.code !== filter.code && !new RegExp(filter.value, 'u').test(sub.value);
  });
  if (filtered.length > 0) {
    return sortSubfields(rest, restSubfields, [...orderedSubfields, ...filtered]);
  }

  return sortSubfields(rest, restSubfields, orderedSubfields);
}

export function findFieldIndex(field, record) {
  return record.fields.indexOf(field);
}

export function logError(error) {
  if (error instanceof CommonsError) {
    logger.log('error', `Error status: ${error.status}`);
    logger.log('error', `Error payload: ${typeof error.payload === 'object' ? `\n${JSON.stringify(error.payload, undefined, 2)}` : error.payload}`);
    logger.log('error', `Error stack:\n${error.stack === undefined ? '' : error.stack}`);

    return;
  }
  if (error === 'SIGINT') {
    logger.log('error', error.stack === undefined ? error : `${error}\n${error.stack}`);

    return;
  }

  logger.log('error', error.stack === undefined ? error : error.stack);
}

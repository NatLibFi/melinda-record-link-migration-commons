import {createLogger} from '@natlibfi/melinda-backend-commons';
import {Error as CommonsError} from '@natlibfi/melinda-commons';
const logger = createLogger();

export function sortSubfields(order, subfields, orderedSubfields = []) {
  const [code, ...rest] = order;
  if (code === undefined) {
    return [...orderedSubfields, ...subfields];
  }

  const filtered = subfields.filter(sub => sub.code === code);
  const restSubfields = subfields.filter(sub => sub.code !== code);
  if (filtered.length > 0) {
    return sortSubfields(rest, restSubfields, [...orderedSubfields, ...filtered]);
  }

  return sortSubfields(rest, restSubfields, orderedSubfields);
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

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
    logger.log('error', `Error status: ${status}`);
    logger.log('error', `Error payload: ${typeof payload === 'object' ? `\n${JSON.stringify(payload, undefined, 2)}` : payload}`);
    logger.log('error', `Error stack:\n${this.stack === undefined ? '' : this.stack}`);

    return;
  }
  if (err === 'SIGINT') {
    logger.log('error', error.stack === undefined ? error : `${error}\n${error.stack}`);

    return;
  }

  logger.log('error', error.stack === undefined ? error : error.stack);
}
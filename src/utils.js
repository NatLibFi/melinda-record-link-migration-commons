import {Error as ApiError, Utils} from '@natlibfi/melinda-commons';

const {createLogger} = Utils;
const logger = createLogger();

export function logError(err) {
	if (err instanceof ApiError) {
		logger.log('error', JSON.stringify(err, null, '\t'));
		return;
	}

	if (err === 'SIGINT') {
		logger.log('error', err);
		return;
	}

	logger.log('error', err.stack === undefined ? err : err.stack);
}

// Job item states
// JOB status flow: PENDING_RECORDS -> PROCESSING_RECORDS -> IN_QUEUE -> IN_PROCESS -> DONE
export const JOB_STATES = {
	DONE: 'DONE',
	IN_PROCESS: 'IN_PROCESS',
	IN_QUEUE: 'IN_QUEUE',
	PENDING_RECORDS: 'PENDING_RECORDS',
	PROCESSING_RECORDS: 'PROCESSING_RECORDS'
};

// Default job config
export const DEFAULT_JOB_CONFIG = {
	oaiPmhRoot: 'bib',
	oaiPmhFormat: 'melinda_marc',
	tags: ['100', '110', '350'],
	ids: false,
	fromTo: false,
	startFrom: false
};


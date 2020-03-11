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
	links: [
		{
			from: {tag: "100", sub:"a", skip: "0"},
			to: {tag: "400", sub: "a"},
			sru: {
				serverUrl: "https://sru.api.melinda-test.kansalliskirjasto.fi/autprv-names",
				version: "2.0",
				maximumRecords: 10,
				query: ""}
		}
	],
	ids: false,
	fromTo: false,
	startFrom: false
};


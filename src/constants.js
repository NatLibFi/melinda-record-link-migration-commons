// Job item states
// JOB status flow: PENDING_SRU_HARVESTER -> PROCESSING_RECORDS -> IN_QUEUE -> IN_PROCESS -> DONE

export const EPIC_JOB_STATES = {
  ABORTED: 'ABORTED',
  DONE: 'DONE',
  ERROR: 'ERROR',
  IN_PROCESS: 'IN_PROCESS',
  PENDING: 'PENDING'
};

export const COMMON_JOB_STATES = {
  DONE: 'DONE',
  PENDING_ERATUONTI: 'PENDING_ERATUONTI',
  ABORTED: 'ABORTED',
  ERROR: 'ERROR'
};

export const IMPORTER_JOB_STATES = {
  PENDING_ERATUONTI_IMPORT: 'PENDING_ERATUONTI_IMPORT',
  PROCESSING_ERATUONTI_IMPORT: 'PROCESSING_ERATUONTI_IMPORT'
};

export const VALIDATOR_JOB_STATES = {
  PENDING_VALIDATION_FILTERING: 'PENDING_VALIDATION_FILTERING',
  PROCESSING_VALIDATION_FILTERING: 'PROCESSING_VALIDATION_FILTERING'
};

export const HARVESTER_JOB_STATES = {
  PENDING_SRU_HARVESTER: 'PENDING_SRU_HARVESTER',
  PROCESSING_SRU_HARVESTING: 'PROCESSING_SRU_HARVESTING',
  PENDING_OAI_PMH_HARVESTER: 'PENDING_OAI_PMH_HARVESTER',
  PROCESSING_OAI_PMH_HARVESTING: 'PROCESSING_OAI_PMH_HARVESTING',
  PENDING_FINTO_HARVESTER: 'PENDING_FINTO_HARVESTER',
  PROCESSING_FINTO_HARVESTING: 'PROCESSING_FINTO_HARVESTING'
};

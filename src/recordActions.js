/* eslint-disable no-unused-vars */
import {Utils} from '@natlibfi/melinda-commons';

export default function () {
  const {createLogger} = Utils;
  const logger = createLogger(); // eslint-disable-line no-unused-vars

  return {filterRecordsBy, filterExistingFields, valuesFromRecord, subfieldsFromRecord, addOrReplaceDataFields};

  // Filter & sort

  function filterRecordsBy(sourceRecord, records, {collect, from, to}) {
    if (from === undefined || to === undefined) {
      return records;
    }

    /* If
    collect: ['a', 'b', 'c', 'd', 'q'],
    from: {tag: '100'},
    to: {tag: '100'}
    */

    const [fieldsFromHost] = subfieldsFromRecord(from, sourceRecord, collect);
    if (fieldsFromHost.length < 1) {
      return false;
    }

    logger.log('verbose', `Getting values from record ${JSON.stringify(to)}, collect: ${collect}`);
    const filteredRecords = records.filter(record => {
      if (record.containsFieldWithValue(to.tag, fieldsFromHost)) {
        logger.log('debug', `Record is valid`);
        return true;
      }

      return false;
    });

    return filteredRecords;
  }

  function filterExistingFields(linkDataFields, record) {
    return linkDataFields.filter(field => {
      logger.log('silly', `Removing duplicate ${field.tag}, ${JSON.stringify(field.subfields)}`);

      if (record.containsFieldWithValue(field.tag, field.subfields)) {
        return false;
      }

      return true;
    });
  }

  // Get

  function valuesFromRecord(from, record) {
    const fields = record.get(new RegExp(`^${from.tag}$`, 'u'));
    if (fields.length === 0) {
      return false;
    }

    return fields.map(field => field.value);
  }

  function subfieldsFromRecord(from, record, collect = []) {
    const fields = record.get(new RegExp(`^${from.tag}$`, 'u'));
    if (fields.length === 0) {
      return false;
    }

    return fields.map(field => {
      if (field.subfields === undefined) {
        return null;
      }

      if (collect.length === 0) {
        return field.subfields;
      }

      return field.subfields.filter(sub => collect.includes(sub.code));
    });
  }

  function addOrReplaceDataFields(record, linkDataFields, {duplicateFilterCodes = ['XXX']}) {
    logger.log('verbose', 'Replacing data fields to record');

    linkDataFields.forEach(field => {
      const filterSubfields = field.subfields.filter(sub => duplicateFilterCodes.includes(sub.code));
      const dublicate = record.getFields(field.tag, filterSubfields);
      if (dublicate.length > 0) {
        logger.log('debug', `Replacing dublicate: ${JSON.stringify(dublicate)}`);
        dublicate.forEach(field => record.removeField(field));
        record.insertField(field);
        return;
      }
      logger.log('debug', `Inserting new field: ${JSON.stringify(field)}`);
      record.insertField(field);
    });

    return record;
  }
}

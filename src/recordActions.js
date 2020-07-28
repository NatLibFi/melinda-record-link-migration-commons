/* eslint-disable no-unused-vars */
import {Utils} from '@natlibfi/melinda-commons';
import {format} from 'util';
import {sortSubfields} from './utils';

export default function () {
  const {createLogger} = Utils;
  const logger = createLogger(); // eslint-disable-line no-unused-vars

  return {filterRecordsBy, filterExistingFields, valuesFromRecord, subfieldsFromRecord, replaceValueInField, addOrReplaceDataFields};

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

    const [fieldsFromHost] = subfieldsFromRecord(sourceRecord, {from, collect});
    if (fieldsFromHost.length < 1) {
      return false;
    }

    logger.log('verbose', `Getting values from host record ${JSON.stringify(from)}, collect: ${collect}`);
    logger.log('debug', `Values from host: ${JSON.stringify(fieldsFromHost)}`);
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

  function valuesFromRecord(record, {from}) {
    const fields = record.get(new RegExp(`^${from.tag}$`, 'u'));
    if (fields.length === 0) {
      return false;
    }

    return fields.map(field => field.value);
  }

  function subfieldsFromRecord(record, {from, collect = []}) {
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

  // Modify

  function replaceValueInField(sourceRecord, record, change) {
    // TEST {from, to, order} = change;
    const {from, to} = change;
    const changeValue = from.value === 'value' ? valuesFromRecord(sourceRecord, change) : subfieldsFromRecord(sourceRecord, change);
    logger.log('info', `Change value ${changeValue}`);

    const formatedChangeValue = toFormat(to, changeValue);
    logger.log('info', `Formated change value ${formatedChangeValue}`);

    const [filterSubfields] = subfieldsFromRecord(sourceRecord, to.where);
    logger.log('info', `Filter subfields ${JSON.stringify(filterSubfields)}`);

    const filteredFields = record.getFields(to.where.to.tag, filterSubfields);
    logger.log('info', `Filtered fields ${JSON.stringify(filteredFields)}`);

    filteredFields.forEach(field => {
      if (JSON.stringify(field.subfields).indexOf(JSON.stringify(formatedChangeValue)) > -1) {
        return;
      }

      const orderedSubfields = sortSubfields(change.order, [...field.subfields, formatedChangeValue]);

      record.insertField({
        tag: field.tag,
        ind1: field.ind1,
        ind2: field.ind2,
        subfields: orderedSubfields
      });

      record.removeField(field);
    });

    return record;

    function toFormat(to, value) {
      if (to.value === 'value') {
        return {tag: to.tag, value: format(to.format, value)};
      }

      return {code: to.value.code, value: format(to.format, value)};
    }
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

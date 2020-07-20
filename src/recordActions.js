/* eslint-disable no-unused-vars */
import {Utils} from '@natlibfi/melinda-commons';
import {format} from 'util';

export default function () {
  const {createLogger} = Utils;
  const logger = createLogger(); // eslint-disable-line no-unused-vars

  return {filterRecordsBy, valuesFromRecord, subfieldsFromRecord, addToRecord};

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

  function addToRecord(value, to, record) {
    logger.log('verbose', 'Adding value to record');
    const [field] = record.get(new RegExp(`^${to.tag}$`, 'u'));
    const formatedValue = format(to.format, value);
    logger.log('debug', formatedValue);

    if (field === undefined) {
      if (to.value === 'value') {
        record.insertField({
          tag: to.tag,
          value: formatedValue
        });

        return record;
      }

      record.insertField({
        tag: to.tag,
        subfields: [
          {
            code: to.value.code,
            value: formatedValue
          }
        ]
      });

      return record;
    }

    if (to.value === 'value') {
      field.value = formatedValue; // eslint-disable-line functional/immutable-data
      return record;
    }

    // Remove old one
    record.removeField(field);
    // Append new one
    record.insertField({
      tag: field.tag,
      ind1: field.ind1,
      ind2: field.ind2,
      subfields: field.subfields.map(sub => {
        if (sub.code === to.value.code) {
          return {code: to.value.code, value: formatedValue};
        }
        return sub;
      })
    });

    // Return record
    return record;
  }
}

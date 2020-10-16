/* eslint-disable no-unused-vars */
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {format} from 'util';
import {sortSubfields} from './utils';

export default function () {
  const logger = createLogger(); // eslint-disable-line no-unused-vars

  return {filterRecordsBy, filterExistingFields, valuesFromRecord, subfieldsFromRecord, replaceValueInField, addOrReplaceDataFields, removeSubfields};

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

    const subfieldsFromSource = subfieldsFromRecord(sourceRecord, {from, collect});
    if (subfieldsFromSource.length < 1) {
      return false;
    }

    logger.log('verbose', `Getting values from source record ${JSON.stringify(from)}, collect: ${collect}`);
    logger.log('debug', `Values from source: ${JSON.stringify(subfieldsFromSource)}`);
    const filteredRecords = records.filter(record => {
      const fields = record.fields.filter(f => f.tag === to.tag); // eslint-disable-line functional/no-this-expression
      const validFields = fields.filter(field => subfieldsFromSource.every(sfQuery => field.subfields.some(sf => sf.code === sfQuery.code && normalize(sf.value) === normalize(sfQuery.value))));
      return validFields.length > 0;
    });

    const validIds = filteredRecords.map(record => {
      const [f001] = record.get('001');
      return f001;
    });

    logger.log('debug', JSON.stringify(validIds));

    return filteredRecords;

    // Normalize values to loosen the mathcing. Example: $a Kekkonen, Urho, or $a Kekkonen, Urho. matches to $a Kekkonen, Urho
    function normalize(value) {
      return value
        .replace(/[^\w\s\p{Alphabetic}]/gu, '')
        .trim();
    }
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

    const subfields = fields.map(field => {
      if (field.subfields === undefined) {
        return null;
      }

      if (collect.length === 0) {
        return field.subfields;
      }

      return field.subfields.filter(sub => collect.includes(sub.code));
    });

    return filterPump(subfields);

    function filterPump(subfields, uniques = []) {
      const [sub, ...rest] = subfields;
      if (sub === undefined) {
        return uniques;
      }
      const matches = uniques.filter(uniq => uniq.code === sub.code && uniq.value === sub.value);
      if (matches.length > 0) {
        return filterPump(rest, uniques);
      }

      return filterPump(rest, [...uniques, sub]);
    }
  }

  // Modify

  function replaceValueInField(sourceRecord, record, change) {
    // TEST {from, to, order} = change;
    const {from, to} = change;
    const changeValues = from.value === 'value' ? valuesFromRecord(sourceRecord, change) : subfieldsFromRecord(sourceRecord, change);
    logger.log('info', `Change value ${changeValues}`);

    changeValues.forEach(changeValue => {
      const formatedChangeValue = toFormat(to, changeValue);
      logger.log('info', `Formated change value ${JSON.stringify(formatedChangeValue)}`);

      const filterSubfields = subfieldsFromRecord(sourceRecord, to.where).flat();
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

  function removeSubfields(record, config) {
    const tagRegexp = new RegExp(`${config.tag}`, 'u');
    const valueRegexp = new RegExp(`${config.value}`, 'u');
    const fields = record.getFields(tagRegexp);
    const updatedFields = fields.map(field => {
      logger.log('debug', JSON.stringify(field));
      const {tag, ind1, ind2, subfields} = field;
      const updatedSubs = subfields.filter(sub => {
        if (sub.code === config.code && valueRegexp.test(sub.value)) {
          logger.log('debug', 'filtering out subfield');
          return false;
        }

        return true;
      });

      return {
        tag, ind1, ind2, subfields: updatedSubs
      };
    });

    fields.forEach(field => record.removeField(field));
    updatedFields.forEach(field => record.insertField(field));
  }
}

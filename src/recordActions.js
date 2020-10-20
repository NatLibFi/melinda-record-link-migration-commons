/* eslint-disable no-unused-vars */
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {format} from 'util';
import {sortSubfields, findFieldIndex} from './utils';

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

    const subfieldsFromSource = subfieldsFromRecord(sourceRecord, {from, collect}).flat();
    if (subfieldsFromSource.length < 1) {
      return false;
    }

    logger.log('verbose', `Getting values from source record ${JSON.stringify(from)}, collect: ${collect}`);
    logger.log('debug', `Values from source: ${JSON.stringify(subfieldsFromSource)}`);
    const filteredRecords = records.filter(record => {
      const fields = record.get(new RegExp(`^${to.tag}$`, 'u'));
      const validFields = fields.filter(field => subfieldsFromSource.every(sfQuery => field.subfields.some(sf => {
        if ([sf.code, sf.value, sfQuery.code, sfQuery.value].includes(undefined)) {
          return false;
        }

        return sf.code === sfQuery.code && normalize(sf.value) === normalize(sfQuery.value);
      })));
      return validFields.length > 0;
    });

    const validIds = filteredRecords.map(record => {
      const [f001] = record.get('001');
      const [f003] = record.get('003');
      return [f001, f003];
    });

    logger.log('debug', JSON.stringify(validIds));

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
    logger.log('verbose', `Change value ${changeValues}`);

    changeValues.forEach(changeValue => {
      const formatedChangeValue = toFormat(to, changeValue);
      logger.log('verbose', `Formated change value ${JSON.stringify(formatedChangeValue)}`);

      const filterSubfields = subfieldsFromRecord(sourceRecord, to.where).flat();
      logger.log('verbose', `Filter subfields ${JSON.stringify(filterSubfields)}`);

      const fields = record.get(new RegExp(`^${to.where.to.tag}$`, 'u'));
      const filteredFieldIndexes = fields.filter(field => {
        if (JSON.stringify(field.subfields).indexOf(JSON.stringify(formatedChangeValue)) > -1) {
          logger.log('verbose', 'Change value allready exists');
          return false;
        }

        return filterSubfields.every(sfQuery => field.subfields.some(sf => {
          if ([sf.code, sf.value, sfQuery.code, sfQuery.value].includes(undefined)) {
            return false;
          }

          return sf.code === sfQuery.code && normalize(sf.value) === normalize(sfQuery.value);
        }));
      }).filter(value => value);
      logger.log('verbose', `Filtered field index ${JSON.stringify(filteredFieldIndexes)}`);

      filteredFieldIndexes.forEach(field => {
        const index = findFieldIndex(field, record);
        const orderedSubfields = sortSubfields(change.order, [...field.subfields, formatedChangeValue]);
        logger.log('verbose', `Ordered subfields: ${JSON.stringify(orderedSubfields)}`);

        record.fields.splice(index, 1, { // eslint-disable-line functional/immutable-data
          tag: field.tag,
          ind1: field.ind1,
          ind2: field.ind2,
          subfields: orderedSubfields
        });
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

      const fields = record.get(new RegExp(`^${field.tag}$`, 'u'));
      const dublicates = fields.map(field => filterSubfields.every(sfQuery => field.subfields.some(sf => {
        if ([sf.code, sf.value, sfQuery.code, sfQuery.value].includes(undefined)) {
          return false;
        }

        return sf.code === sfQuery.code && normalize(sf.value) === normalize(sfQuery.value);
      })));

      if (dublicates.length > 0) {
        logger.log('debug', `Replacing dublicate index: ${JSON.stringify(dublicates)}`);
        dublicates.forEach(dField => {
          const dFieldIndex = findFieldIndex(field, record);
          record.fields.splice(dFieldIndex, 1, dField); // eslint-disable-line functional/immutable-data
        });
        return;
      }

      logger.log('debug', `Inserting new field: ${JSON.stringify(field)}`);
      record.insertField(field);
    });
  }

  function removeSubfields(record, config) {
    logger.log('verbose', 'Removing subfields from record');
    const valueRegexp = new RegExp(`${config.value}`, 'u');
    const fields = record.getFields(config.tag);
    fields.forEach(field => {
      logger.log('debug', `Current field: ${JSON.stringify(field)}`);
      const {tag, ind1, ind2, subfields} = field;

      const updatedSubs = subfields.filter(sub => {
        if (sub.code === config.code && valueRegexp.test(sub.value)) {
          logger.log('debug', `Filtering out subfield: ${JSON.stringify(sub)}`);
          return false;
        }

        return true;
      });

      const index = findFieldIndex(field, record);
      record.fields.splice(index, 1, { // eslint-disable-line functional/immutable-data
        tag, ind1, ind2, subfields: updatedSubs
      });
    });
  }

  // Normalize values to loosen the mathcing. Example: $a Kekkonen, Urho, or $a Kekkonen, Urho. matches to $a Kekkonen, Urho
  function normalize(value) {
    return value
      .replace(/[^\w\s\p{Alphabetic}]/gu, '')
      .trim();
  }
}

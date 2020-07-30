import validateFactory from '@natlibfi/marc-record-validate';
// AccessRights,DoubleCommas, DuplicatesInd1, EmptyFields, EndingPunctuation, FieldExclusion, FieldsPresent, FieldStructure, FixedFields, IdenticalFields, IsbnIssn, ItemLanguage,
// Punctuation, ResolvableExtReferences, SortTags, SubfieldExclusion, UnicodeDecomposition, Urn
import {
  FieldExclusion as fieldExclusion,
  FieldsPresent as fieldsPresent,
  FieldStructure as fieldStructure,
  FixedFields as fixedFields,
  ResolvableExtReferences as resolvableExtReferences,
  SubfieldExclusion as subfieldExclusion
} from '@natlibfi/marc-record-validators-melinda';
import {Utils} from '@natlibfi/melinda-commons';

const {createLogger} = Utils;
const logger = createLogger();

export async function createValidationFactory(validationFactoryOptions) {
  logger.log('verbose', 'Creating validation factory');
  logger.log('silly', `with options: ${JSON.stringify(validationFactoryOptions)}`);
  const factoryOptions = [];
  if (validationFactoryOptions.fieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldExclusion(fieldExclusionStringsToRegExps(validationFactoryOptions.fieldExclusion))); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldsPresent !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.fieldsPresent.map(config => new RegExp(`${config}`, 'u'));
    factoryOptions.push(await fieldsPresent(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldStructure !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.fieldStructure.map(config => {
      const subfields = Object.create(null);
      Object.entries(config.subfields).forEach(([key, value]) => {
        subfields[key] = {pattern: new RegExp(`${value}`, 'u')}; // eslint-disable-line functional/immutable-data
      });
      return {tag: new RegExp(`${config.tag}`, 'u'), subfields};
    });
    factoryOptions.push(await fieldStructure(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fixedFields !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.fixedFields.map(config => new RegExp(`${config}`, 'u'));
    factoryOptions.push(await fixedFields(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.resolvableExtReferences !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.resolvableExtReferences.map(config => new RegExp(`${config}`, 'u'));
    factoryOptions.push(await resolvableExtReferences(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.subfieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.subfieldExclusion.map(config => {
      const subfields = config.subfields.map(sub => ({code: new RegExp(`${sub.code}`, 'u')}));
      return {tag: new RegExp(`${config.tag}`, 'u'), subfields};
    });
    factoryOptions.push(await subfieldExclusion(regExps)); // eslint-disable-line functional/immutable-data
  }

  await Promise.all(factoryOptions);
  // Logger.log('verbose', `Factory options:\n${JSON.stringify(factoryOptions)}`);
  return validateFactory(factoryOptions);
}

function fieldExclusionStringsToRegExps(fieldExclusion) {
  return fieldExclusion.map(config => {
    if (typeof config === 'string') {
      return new RegExp(`${config}`, 'u');
    }

    const tag = new RegExp(`${config.tag}`, 'u');
    const ind1 = config.ind1 ? new RegExp(`${config.ind1}`, 'u') : null;
    const ind2 = config.ind2 ? new RegExp(`${config.ind2}`, 'u') : null;
    const subfields = config.subfields ? config.subfields.map(sub => ({code: new RegExp(`${sub.code}`, 'u'), value: new RegExp(`${sub.value}`, 'u')})) : null;
    return {tag, ind1, ind2, subfields};
  });
}

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
    const regExps = validationFactoryOptions.fieldExclusion.map(regExp => new RegExp(`${regExp}`, 'u'));
    factoryOptions.push(await fieldExclusion(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldsPresent !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.fieldsPresent.map(regExp => new RegExp(`${regExp}`, 'u'));
    factoryOptions.push(await fieldsPresent(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldStructure !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.fieldStructure.map(regExp => new RegExp(`${regExp}`, 'u'));
    factoryOptions.push(await fieldStructure(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fixedFields !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.fixedFields.map(regExp => new RegExp(`${regExp}`, 'u'));
    factoryOptions.push(await fixedFields(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.resolvableExtReferences !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.resolvableExtReferences.map(regExp => new RegExp(`${regExp}`, 'u'));
    factoryOptions.push(await resolvableExtReferences(regExps)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.subfieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    const regExps = validationFactoryOptions.subfieldExclusion.map(regExp => new RegExp(`${regExp}`, 'u'));
    factoryOptions.push(await subfieldExclusion(regExps)); // eslint-disable-line functional/immutable-data
  }

  await Promise.all(factoryOptions);
  // Logger.log('verbose', `Factory options:\n${JSON.stringify(factoryOptions)}`);
  return validateFactory(factoryOptions);
}

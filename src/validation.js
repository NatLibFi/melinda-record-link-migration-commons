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
  logger.log('info', `Creating validatin factory with options: ${JSON.stringify(validationFactoryOptions)}`);
  const factoryOptions = [];
  if (validationFactoryOptions.fieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldExclusion(validationFactoryOptions.fieldExclusion)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldsPresent !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldsPresent(validationFactoryOptions.fieldsPresent)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldStructure !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldStructure(validationFactoryOptions.fieldStructure)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fixedFields !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fixedFields(validationFactoryOptions.fixedFields)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.resolvableExtReferences !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await resolvableExtReferences(validationFactoryOptions.resolvableExtReferences)); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.subfieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await subfieldExclusion(validationFactoryOptions.subfieldExclusion)); // eslint-disable-line functional/immutable-data
  }

  await Promise.all(factoryOptions);
  logger.log('debug', `Factory options:\n${JSON.stringify(factoryOptions)}`);
  // Const validate = validateFactory([await fieldStructure([{tag: /^003$/u, valuePattern: /^FI-MELINDA$/u}])]);
  return validateFactory(factoryOptions);
}

import validateFactory from '@natlibfi/marc-record-validate';
// AccessRights,DoubleCommas, DuplicatesInd1, EmptyFields, EndingPunctuation, FieldExclusion, FieldsPresent, FieldStructure, FixedFields, IdenticalFields, IsbnIssn, ItemLanguage,
// Punctuation, ResolvableExtReferences, SortTags, SubfieldExclusion, UnicodeDecomposition, Urn
import {
  FieldExclusion as fieldExclusion,
  FieldsPresent as fieldsPresent,
  FieldStructure as fieldStructure,
  SubfieldExclusion as subfieldExclusion
} from '@natlibfi/marc-record-validators-melinda';
import {createLogger} from '@natlibfi/melinda-backend-commons';

const logger = createLogger();

export async function createValidationFactory(validationFactoryOptions) {
  logger.log('verbose', 'Creating validation factory');
  logger.log('silly', `with options: ${JSON.stringify(validationFactoryOptions)}`);
  const factoryOptions = [];
  if (validationFactoryOptions.fieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldExclusion(parseValidatorPump(validationFactoryOptions.fieldExclusion))); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldsPresent !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldsPresent(parseValidatorPump(validationFactoryOptions.fieldsPresent))); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.fieldStructure !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await fieldStructure(parseValidatorPump(validationFactoryOptions.fieldStructure))); // eslint-disable-line functional/immutable-data
  }
  if (validationFactoryOptions.subfieldExclusion !== undefined) { // eslint-disable-line functional/no-conditional-statement
    factoryOptions.push(await subfieldExclusion(parseValidatorPump(validationFactoryOptions.subfieldExclusion))); // eslint-disable-line functional/immutable-data
  }

  await Promise.all(factoryOptions);
  // Logger.log('verbose', `Factory options:\n${JSON.stringify(factoryOptions)}`);
  return validateFactory(factoryOptions);
}

const parserList = [regExpLeader, regExpTag, regExpValue, regExpValuePattern, regExpInd1, regExpInd2, regExpSubfields, booleanStrict, parseDependencies];

function parseValidatorPump(validators, parsed = []) {
  const [validator, ...rest] = validators;
  if (validator === undefined) {
    logger.log('info', `Parsed validators: ${JSON.stringify(parsed)}`);
    return parsed;
  }

  if (typeof validator === 'string') {
    logger.log('info', `Parsed validator: ${JSON.stringify(validator)}`);
    return parseValidatorPump(rest, [...parsed, new RegExp(`${validator}`, 'u')]);
  }

  const parsedValidator = parseRecordValidators(validator, parserList);
  return parseValidatorPump(rest, [...parsed, parsedValidator]);
}

function parseRecordValidators(object, parsers = parserList) {
  const [parser, ...rest] = parsers;
  if (parser === undefined) {
    logger.log('info', `Parsed validator: ${JSON.stringify(object)}`);
    return object;
  }

  const parsed = parser(object);
  return parseRecordValidators(parsed, rest);
}

function regExpLeader(object) {
  if (object.leader === undefined) {
    return object;
  }

  if (typeof object.leader === 'string') {
    return {...object, leader: new RegExp(`${object.leader}`, 'u')};
  }

  return object;
}

function regExpTag(object) {
  if (object.tag === undefined) {
    return object;
  }

  if (typeof object.tag === 'string') {
    return {...object, tag: new RegExp(`${object.tag}`, 'u')};
  }

  return object;
}

function regExpValue(object) {
  if (object.value === undefined) {
    return object;
  }

  if (typeof object.value === 'string') {
    return {...object, value: new RegExp(`${object.value}`, 'u')};
  }

  return object;
}

function regExpValuePattern(object) {
  if (object.valuePattern === undefined) {
    return object;
  }

  if (typeof object.valuePattern === 'string') {
    return {...object, valuePattern: new RegExp(`${object.valuePattern}`, 'u')};
  }

  return object;
}

function regExpInd1(object) {
  if (object.ind1 === undefined) {
    return object;
  }

  if (typeof object.ind1 === 'string') {
    return {...object, ind1: new RegExp(`${object.ind1}`, 'u')};
  }

  return object;
}

function regExpInd2(object) {
  if (object.ind2 === undefined) {
    return object;
  }

  if (typeof object.ind2 === 'string') {
    return {...object, ind2: new RegExp(`${object.ind2}`, 'u')};
  }

  return object;
}

function regExpSubfields(object) {
  if (object.subfields === undefined) {
    return object;
  }

  if (Array.isArray(object.subfields) && object.subfields.length > 0) {
    const subfields = object.subfields.map(sub => {
      const sub2 = regExpCode(sub);
      const sub3 = regExpValue(sub2);
      return sub3;
    });

    return {...object, subfields};
  }

  if (typeof object.subfields === 'object') {
    const subfields = Object.create(null);
    Object.entries(object.subfields).forEach(([key, value]) => {
      const value2 = regExpPattern(value);
      const value3 = booleanRequired(value2);
      const value4 = numberMaxOccurrence(value3);
      subfields[key] = value4; // eslint-disable-line functional/immutable-data
    });
    return {...object, subfields};
  }

  return object;
}

function regExpCode(object) {
  if (object.code === undefined) {
    return object;
  }

  if (typeof object.code === 'string') {
    return {...object, code: new RegExp(`${object.code}`, 'u')};
  }

  return object;
}

function regExpPattern(object) {
  if (object.pattern === undefined) {
    return object;
  }

  if (typeof object.pattern === 'string') {
    return {...object, pattern: new RegExp(`${object.pattern}`, 'u')};
  }

  return object;
}

function booleanRequired(object) {
  if (object.required === undefined) {
    return object;
  }

  if (typeof object.required === 'string') {
    return {...object, required: Boolean.parseBoolean(object.required)};
  }

  return object;
}

function numberMaxOccurrence(object) {
  if (object.maxOccurrence === undefined) {
    return object;
  }

  if (typeof object.maxOccurrence === 'string') {
    return {...object, maxOccurrence: parseInt(object.maxOccurrence, 10)};
  }

  return object;
}

function booleanStrict(object) {
  if (object.strict === undefined) {
    return object;
  }

  if (typeof object.strict === 'string') {
    return {...object, strict: Boolean.parseBoolean(object.strict)};
  }

  return object;
}

function parseDependencies(object) {
  if (object.dependencies === undefined) {
    return object;
  }

  if (Array.isArray(object.dependencies) && object.dependencies.lenght > 0) {
    const parsers = [regExpLeader, regExpTag, regExpInd1, regExpInd2, regExpValuePattern, regExpSubfields];
    const parsed = object.dependencies.map(dep => parseRecordValidators(dep, parsers));
    return {...object, dependencies: parsed};
  }

  return object;
}

// import {expect} from 'chai';
import generateTests from '@natlibfi/fixugen';
import recordActions from './recordActions';
import {READERS} from '@natlibfi/fixura';
import {MarcRecord} from '@natlibfi/marc-record';
import {expect} from 'chai';

generateTests({
  callback,
  path: [__dirname, '..', 'test-fixtures', 'recordActions'],
  useMetadataFile: true
});

async function callback({getFixture, testedFunction, duplicateFilterCodes, config, change}) {
  const resultRecord = new MarcRecord(getFixture({components: ['resultRecord.json'], reader: READERS.JSON}));
  const testRecord = new MarcRecord(getFixture({components: ['testRecord.json'], reader: READERS.JSON}));
  // console.log(resultRecord); // eslint-disable-line no-console
  // console.log(testRecord); // eslint-disable-line no-console
  // console.log(change); // eslint-disable-line no-console

  if (testedFunction === 'addOrReplaceDataFields') {
    const {addOrReplaceDataFields} = recordActions();
    const linkDataFields = getFixture({components: ['linkDataFields.json'], reader: READERS.JSON});

    addOrReplaceDataFields(testRecord, linkDataFields, {duplicateFilterCodes});

    expect(testRecord).to.eqls(resultRecord);
    return;
  }

  if (testedFunction === 'removeSubfields') {
    const {removeSubfields} = recordActions();

    removeSubfields(testRecord, config);
    // console.log(JSON.stringify(testRecord, undefined, 2)); // eslint-disable-line no-console

    expect(testRecord).to.eqls(resultRecord);
    return;
  }

  if (testedFunction === 'replaceValueInField') {
    const sourceRecord = new MarcRecord(getFixture({components: ['sourceRecord.json'], reader: READERS.JSON}));
    const {replaceValueInField} = recordActions();
    // console.log(sourceRecord); // eslint-disable-line no-console

    await replaceValueInField(sourceRecord, testRecord, change);
    // console.log(JSON.stringify(linkedRecord, undefined, 2)); // eslint-disable-line no-console

    expect(testRecord).to.eqls(resultRecord);
    return;
  }
}

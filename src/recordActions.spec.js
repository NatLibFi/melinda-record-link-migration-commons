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
  if (testedFunction === 'addOrReplaceDataFields') {
    const resultRecord = new MarcRecord(getFixture({components: ['resultRecord.json'], reader: READERS.JSON}));
    const testRecord = new MarcRecord(getFixture({components: ['testRecord.json'], reader: READERS.JSON}));
    const linkDataFields = getFixture({components: ['linkDataFields.json'], reader: READERS.JSON});
    const {addOrReplaceDataFields} = recordActions();

    addOrReplaceDataFields(testRecord, linkDataFields, {duplicateFilterCodes});

    expect(testRecord).to.eqls(resultRecord);
    return;
  }

  if (testedFunction === 'filterRecordsBy') {
    const sourceRecord = new MarcRecord(getFixture({components: ['sourceRecord.json'], reader: READERS.JSON}));
    const recordList = getFixture({components: ['recordList.json'], reader: READERS.JSON}).map(record => new MarcRecord(record));
    // console.log(JSON.stringify(recordList, undefined, 2)); // eslint-disable-line no-console
    const resultRecordList = getFixture({components: ['resultRecordList.json'], reader: READERS.JSON});
    const {filterRecordsBy} = recordActions();

    const filteredRecords = filterRecordsBy(sourceRecord, recordList, config);

    expect(filteredRecords).to.eqls(resultRecordList);
    return;
  }

  if (testedFunction === 'removeSubfields') {
    const resultRecord = new MarcRecord(getFixture({components: ['resultRecord.json'], reader: READERS.JSON}));
    const testRecord = new MarcRecord(getFixture({components: ['testRecord.json'], reader: READERS.JSON}));
    const {removeSubfields} = recordActions();

    removeSubfields(testRecord, config);
    // console.log(JSON.stringify(testRecord, undefined, 2)); // eslint-disable-line no-console

    expect(testRecord).to.eqls(resultRecord);
    return;
  }

  if (testedFunction === 'replaceValueInField') {
    const resultRecord = new MarcRecord(getFixture({components: ['resultRecord.json'], reader: READERS.JSON}));
    const testRecord = new MarcRecord(getFixture({components: ['testRecord.json'], reader: READERS.JSON}));
    const sourceRecord = new MarcRecord(getFixture({components: ['sourceRecord.json'], reader: READERS.JSON}));
    const {replaceValueInField} = recordActions();
    // console.log(sourceRecord); // eslint-disable-line no-console

    await replaceValueInField(sourceRecord, testRecord, change);
    // console.log(JSON.stringify(linkedRecord, undefined, 2)); // eslint-disable-line no-console

    expect(testRecord).to.eqls(resultRecord);
    return;
  }
}

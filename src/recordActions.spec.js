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

async function callback({getFixture, change}) {
  const linkedRecord = new MarcRecord(getFixture({components: ['linkedRecord'], reader: READERS.JSON}), {subfieldValues: false});
  const sourceRecord = new MarcRecord(getFixture({components: ['sourceRecord'], reader: READERS.JSON}), {subfieldValues: false});
  const resultRecord = getFixture({components: ['resultRecord'], reader: READERS.JSON});

  // console.log(linkedRecord); // eslint-disable-line no-console
  // console.log(sourceRecord); // eslint-disable-line no-console
  // console.log(change); // eslint-disable-line no-console

  const {replaceValueInField} = recordActions();

  await replaceValueInField(sourceRecord, linkedRecord, change);

  // console.log(JSON.stringify(linkedRecord)); // eslint-disable-line no-console
  expect(linkedRecord).to.eqls(resultRecord);
}

/* eslint-disable no-unused-vars */
import {createLogger} from '@natlibfi/melinda-backend-commons';
import {format} from 'util';
import {sortSubfields} from './utils';

export default function () {
  const logger = createLogger(); // eslint-disable-line no-unused-vars

  return {convertLinkDataToControlFields, convertLinkDataToDataFields};

  function convertLinkDataToControlFields(linkDataArray, {add}) {
    logger.log('verbose', 'Creating control fields from linkDataArray');
    // Add:{"tag": 001, "value": "%s"}
    // LinkDataArray:[[{"value":"012954824"}]],
    return linkDataArray.map(linkData => {
      const [value] = linkData;
      return {tag: add.tag, value: format(add.value, value)};
    });
  }

  function convertLinkDataToDataFields(linkDataArray, {add, order}) {
    logger.log('verbose', 'Creating data fields from linkDataArray');

    // LinkDataArray:[[{"code":"a","value":"presidents"},{"code":"2","value":"eng"},{"code":"0","value":"p17598"}]],
    // Add:{"tag":"650","ind1":" ","ind2":"7","subfields":[{"code":"a","value":"%s"},{"code":"2","value":"yso/%s"},{"code":"0","value":"http://www.yso.fi/onto/yso/%s"}]},
    // Order:["a","2","0"]

    // LinkDataArray:[[{"code": "ind1" value: " "},{"code": "ind2" value: "7"},{"code":"a","value":"presidents"},{"code":"2","value":"eng"},{"code":"0","value":"p17598"}]],
    // Add:{"tag":"650", "subfields":[{"code":"a","value":"%s"},{"code":"2","value":"yso/%s"},{"code":"0","value":"http://www.yso.fi/onto/yso/%s"}]},
    // Order:["a","2","0"]

    return linkDataArray.map(linkData => {
      const [ind1] = linkData.filter(data => data.code === 'ind1').map(data => data.value);
      logger.log('silly', `New field ind1 ${ind1}`);
      const [ind2] = linkData.filter(data => data.code === 'ind2').map(data => data.value);
      logger.log('silly', `New field ind2 ${ind2}`);

      const processedSubfields = add.subfields.map(sub => {
        const [linkkedSubfield] = linkData.filter(linksub => linksub.code === sub.code);
        if (linkkedSubfield === undefined) {
          // Pass preset subfields
          return sub;
        }

        return {code: sub.code, value: format(sub.value, linkkedSubfield.value)};
      });

      if (order) {
        const orderedSubfields = sortSubfields(order, processedSubfields);

        return {
          tag: add.tag,
          ind1: ind1 || add.ind1,
          ind2: ind2 || add.ind2,
          subfields: orderedSubfields
        };
      }

      return {
        tag: add.tag,
        ind1: ind1 || add.ind1,
        ind2: ind2 || add.ind2,
        subfields: processedSubfields
      };
    });
  }
}

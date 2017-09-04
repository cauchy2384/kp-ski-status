/**
 * \todo check when slopes statuses will be shown that they are parsed correctly
 * */

const tabletojson = require('tabletojson');
const htmlToText = require('html-to-text');
const cheerio = require('cheerio');
const request = require('request'); //eslint-disable-line
const rp = require('request-promise');


const has = Object.prototype.hasOwnProperty;


const slopesUrl = 'https://rosaski.com/skiing/trails/';
const slopesTableNumber = 12;

const liftsUrl = 'https://rosaski.com/skiing/lifts/';
const temperatureUrl = 'https://rosaski.com/skiing/live/';


/**
 * @param input HTML string
 * @returns {string} human-readable string
 */
function mParseHtmlValue(input) {
  let result = '';
  const regExp = /"(.*?)"/;
  let difficulty = regExp.exec(input);
  if (difficulty) {
    difficulty = difficulty[0];
    // remove quotes
    difficulty = difficulty.substring(1, difficulty.length - 1);
    result = htmlToText.fromString(difficulty);
  }
  return result;
}


async function mGetSlopes() {
  const slopes = [];
  // read HTML
  const tablesAsJson = await tabletojson.convertUrl(slopesUrl, { stripHtml: false });
  // get only table with slopes
  if (has.call(tablesAsJson, slopesTableNumber)) {
    const slopesTable = tablesAsJson[slopesTableNumber];
    // parse each slope
    Object.values(slopesTable).forEach((slopeRow) => {
      if (has.call(slopeRow, '0') && has.call(slopeRow, '_5')) {
        const name = htmlToText.fromString(slopeRow['0']);
        let status = mParseHtmlValue(slopeRow['_5']);
        switch (status) {
          case 'green':
            status = 'opened';
            break;
          case 'yellow':
          case 'red':
            status = 'closed';
            break;
          default:
            status = 'unknown';
            break;
        }
        const data = { name, status };
        if (data.name !== 'Все трассы') {
          slopes.push(data);
        }
      }
    });
  }
  return slopes;
}


async function mGetLifts() {
  const lifts = [];
  // read HTML
  const page = await rp(liftsUrl);
  const $ = cheerio.load(page);
  const liftsTable = $('table[class=trtable]');
  liftsTable.find('tr').each((index, element) => {
    let name = null;
    let status = null;
    $(element).find('td').each((i, e) => {
      if (i === 0) {
        name = $(e).text().trim();
      } else if (i === 4) {
        status = $(e).find('span').attr('title');
        switch (status) {
          case 'Подъёмник открыт':
            status = 'opened';
            break;
          case 'Подъёмник временно закрыт':
          case 'Подъёмник закрыт':
            status = 'closed';
            break;
          default:
            status = 'unknown';
            break;
        }
      }
    });
    if (name && status) {
      const data = { name, status };
      lifts.push(data);
    }
  });
  return lifts;
}


async function mGetWeather() {
  const weather = [];
  // read HTML
  const page = await rp(temperatureUrl);
  const $ = cheerio.load(page);
  const table = $('table[class=\"wthr_struct _main\"]'); //eslint-disable-line
  table.find('tr > td').each((index, element) => {
    let name = null;
    let temperature = null;
    let wind = null;
    let snow = null;
    $(element).find('div').each((i, e) => {
      switch (i) {
        case 0:
          name = $(e).text();
          break;
        case 1:
          temperature = $(e).text();
          break;
        case 2:
          wind = $(e).text();
          break;
        case 3:
          snow = $(e).text();
          break;
        default:
          break;
      }
    });
    if (name) {
      const data = { name, temperature, wind, snow };
      weather.push(data);
    }
  });
  return weather;
}


/**
 * @returns {Object} JSON with slopes states
 * */
async function get() {
  let result = {};
  try {
    const slopes = await mGetSlopes();
    const lifts = await mGetLifts();
    const weather = await mGetWeather();
    result = { slopes, lifts, weather };
  } catch (error) {
    result = { error };
  }
  return result;
}


module.exports = get;

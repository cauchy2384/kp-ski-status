/**
 * \todo check when slopes statuses will be shown that they are parsed correctly
 * */

const cheerio = require('cheerio');
const request = require('request'); // eslint-disable-line
const rp = require('request-promise');


const url = 'https://gorkygorod.ru/slopes_new';


/**
 * @returns {Object} JSON with slopes states
 * */
async function get() {
  let result = {};
  let page = null;
  try {
    // read page
    page = await rp(url);
    const $ = cheerio.load(page);
    // find elevators
    const slopes = [];
    const lifts = [];
    const elevators = $('div[class=elevators-list]');
    elevators.find('div > ul > li').each((index, element) => {
      const name = $(element).text().trim();
      let status = $(element).attr('class').replace('btn btn-', '').trim();
      switch (status) {
        case 'success':
          status = 'opened';
          break;
        case 'default':
          status = 'closed';
          break;
        default:
          status = 'unknown';
          break;
      }
      const object = { name, status };
      // differ slopes from lifts
      const re = new RegExp(/^K[0-9]{1,}$/g);
      if (re.test(name)) {
        lifts.push(object);
      } else {
        slopes.push(object);
      }
    });
    result = { slopes, lifts };
  } catch (error) {
    result = { error, page };
  }
  return result;
}


module.exports = get;

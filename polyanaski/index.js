const request = require('request'); //eslint-disable-line
const rp = require('request-promise');


const url = 'http://polyanaski.ru/map/ajax/objStatus.php';
const liftType = 'Канатная дорога';
const slopeType = 'Горнолыжная трасса';
const types = [liftType, slopeType];


const has = Object.prototype.hasOwnProperty;


async function polyanaski() {
  let result = {};
  let page = null;
  try {
    // read page
    page = await rp(url);
    const json = JSON.parse(page.trim());
    // filter slopes && lifts
    const slopes = [];
    const lifts = [];
    const weather = [];
    if (has.call(json, 'Objects')) {
      json.Objects.forEach((obj) => {
        if (types.indexOf(obj.type) !== -1) {
          const name = obj.name;
          let status = obj.status;
          switch (status) {
            case 1:
              status = 'opened';
              break;
            case 0:
              status = 'closed';
              break;
            default:
              status = 'unknown';
              break;
          }
          const data = { name, status };
          if (obj.type === liftType) {
            lifts.push(data);
          } else {
            slopes.push(data);
          }
        }
      });
      // get temperature
      if (has.call(json, 'Temperature')) {
        json.Temperature.forEach((value) => {
          const id = value.id;
          const name = json.Objects.filter(obj => obj.id === id)[0].name;
          const temperature = value.temperature;
          const data = { name, temperature };
          weather.push(data);
        });
      }
    }
    result = { slopes, lifts, weather };
  } catch (error) {
    result = { error, page };
  }

  return result;
}


module.exports = polyanaski;

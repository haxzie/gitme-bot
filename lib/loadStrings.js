const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); 

module.exports = () => {
    //load the strings
    try {
        return yaml.safeLoad(fs.readFileSync(path.join(__dirname,'strings.yml')));
      } catch (error) {
        console.error(error);
        process.exit(-1); 
      }
}
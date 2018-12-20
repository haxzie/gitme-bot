const { Wring } = require('wring-js');
const wring = new Wring();
const strings = wring.load('strings.yml', __dirname);

module.exports = (contents, username) => {

    let frontMatter = contents.trim();
    if (frontMatter.length > 0) {
        let parts = frontMatter.split('\n');

        // check if the file contains all the required fields including hyphens
        if (parts.length != 4 
            ||!parts[0].match(/^---$/g) 
            ||!parts[1].match(/^username:\s?[a-zA-Z0-9\-_]+$/g)
            ||!parts[2].match(/^fullname:\s?[a-zA-Z\s\-\._]+$/g)
            ||!parts[3].match(/^---$/g)) {

            console.error("Invalid markdown content format");

            let message = strings.with('invalidFormat').format({ username: username });
            return {
                merge: false,
                message: message
            };

        } else {

            // check if the username or fullname contains only valid characters
            let givenUsername = parts[1].match(/^username:\s?([a-zA-Z0-9\-_]+)$/g)[0];
            let givenFullname = parts[2].match(/^fullname:\s?([a-zA-Z\s\-\._])+$/g)[0];

            if (!givenUsername || !givenFullname) {
                console.error("username/fullname is invalid");

                let message = strings.with('invalidUsername').format({ username: username });
                return {
                    merge: false,
                    message: message
                }
            } else if (!givenUsername.match(username)){
                console.error("Username doesn't match!");

                let message = strings.with('mismatchInUsername').format({ username: username });
                return {
                    merge: false,
                    message: message
                }
            }
        }

        // Everything looks good!
        let message = strings.with('readyToMerge').format({ username: username });
        return {
            merge: true,
            message: message
        }
    } else {

        // file is empty
        let message = strings.with('emptyFile').format({ username: username });
        return {
            merge: false,
            message: message
        }
    }
}
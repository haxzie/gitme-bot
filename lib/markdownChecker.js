const cStrings = require('./loadStrings')();

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

            let message = cStrings.invalidFormat.replace(/{username}/g, username);
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

                let message = cStrings.invalidUsername.replace(/{username}/g, username);
                return {
                    merge: false,
                    message: message
                }
            } else if (!givenUsername.match(username)){
                console.error("Username doesn't match!");

                let message = cStrings.mismatchInUsername.replace(/{username}/g, username);
                return {
                    merge: false,
                    message: message
                }
            }
        }

        // Everything looks good!
        let message = cStrings.readyToMerge.replace(/{username}/g, username);
        return {
            merge: true,
            message: message
        }
    } else {

        // file is empty
        let message = cString.emptyFile.replace(/{username}/g, username);
        return {
            merge: false,
            message: message
        }
    }
}
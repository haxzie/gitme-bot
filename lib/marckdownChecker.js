module.exports = (contents, username) => {

    let frontMatter = contents.trim();
    if (frontMatter.length > 0) {
        let parts = frontMatter.split('\n');

        // check if the file contains all the required fields including hyphens
        if (parts.length != 4 || !parts[0].match(/^---$/g) || !parts[3].match(/^---$/g)) {
            message = `Hey @${username}, it seems like the data in the markdown file doesn't match the specified format.
            Please check the file you have edited/added to be in the following format (including the starting and trailing hyphens).
            https://github.com/haxzie/GitMe/blob/ce8849bf684e2fab17e2149c23b59a2c47ce5ae0/sample.md#L1-L4
            `;
            return {
                merge: false,
                message: message.replace(/\\n/g, "<br/>")
            };
        } else if (!parts[1].match(/^username:\s[a-zA-Z0-9\-]+$/g)) {
            let message = ``
        }
        // check for start and end hyphen markers
    }
}
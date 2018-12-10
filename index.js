const axios = require('axios');

module.exports = app => {
  app.log('Yay, the app was loaded!');

  app.on('issues.opened', async context => {
    const issueComment = context.issue({
      body: 'Thanks for opening this issue!'
    })
    return context.github.issues.createComment(issueComment)
  });

  app.on('status', async context => {
    //console.log(JSON.stringify(context));
  });

  app.on('check_suite.completed', async context => {
    const checkSuite = context.payload.check_suite;
    const sender = context.payload.sender.login;
    const config = await context.config('strings.yml');

    if (!config) {
      console.error(`Unable to retrieve config file from github, 
      make sure strings.yml file exists in .github sub directory`);
      return;
    }

    // check if the checks result is success
    if (checkSuite.conclusion !== "success") {
      console.error("CheckSuite Failed!");
      return;
    };

    // Checks are all Green, Submit the deploy preview URL
    console.log("CheckSuite Success. Creating deploy URL comment...");
    //get the PR Number
    const pullRequestNumber = checkSuite.pull_requests[0].number;

    console.log(`Adding Comment on Pull Request #${pullRequestNumber}`);
    let deployURL = `https://deploy-preview-${pullRequestNumber}--gitme.netlify.com/`;
    let commentBody = config.checksPassed;
    commentBody.replace(/{deployURL}/g, deployURL);

    const prComment = context.issue({
      number: pullRequestNumber,
      body: commentBody
    });
    // create the deploy preview comment
    context.github.issues.createComment(prComment);

    // Download the changed file and initialize checks
    console.log("Initialize file checks...");

    const filesResponse = await context.github.pullRequests.listFiles(context.issue({
      number: pullRequestNumber
    }));

    if (filesResponse && filesResponse.status === 200) {

      if (filesResponse.data.length == 1) {
        let file = filesResponse.data[0];
        if (file.filename.match(/^src\/profiles\//g)) {
          // retrieve the file and check
          const contents = await axios.get(file.raw_url);
          console.log(contents.data);

        }
      }

    }
  });
}
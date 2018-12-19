const axios = require('axios');
const checker = require('./lib/markdownChecker');
const { Wring } = require('wring-js');
const wring = new Wring();
const strings = wring.load('lib/strings.yml');

module.exports = app => {
  app.log('Yay, the app was loaded!');

  // comment when new issue is opened
  app.on('issues.opened', async context => {
    const issueComment = context.issue({
      body: strings.get('newIssue')
    })
    await context.github.issues.addLabels(context.issue({
      labels: ["Awaiting Review"]
    }));
    return context.github.issues.createComment(issueComment)
  });

  app.on('status', async context => {
    //console.log(JSON.stringify(context));
  });

  app.on('check_suite.completed', async context => {
    const checkSuite = context.payload.check_suite;
    const sender = context.payload.sender.login;

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
    let deployURL = strings.with('deployURL').format({ number: pullRequestNumber });
    let commentBody = strings.with('checksPassed').format({ deployURL: deployURL });

    // create the deploy preview comment
    context.github.issues.createComment(context.issue({
      number: pullRequestNumber,
      body: commentBody
    }));

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
          let check_results = checker(contents.data, sender);
          context.github.issues.createComment(context.issue({
            number: pullRequestNumber,
            body: check_results.message
          }));

          // Okay this is kinda wiered API response here
          // the request will result in 404 if the PR isn't merged
          // and 204 if the PR is merged
          if (check_results.merge) {
            try {
              let isMerged = await context.github.pullRequests.checkIfMerged(context.issue({
                number: pullRequestNumber
              }));
              console.log("Pull request already merged")
            } catch (error) {
              console.log("Pull request not merged");
              // Let's merge it! Yaay
              try {

                // Status 200 if merged, else unable to merge 
                await context.github.pullRequests.merge(context.issue({
                  number: pullRequestNumber
                }));

                console.log("Successfully merged the PullRequest!")
                console.log("Sending Congratulations!")

                let message = strings.with('successfullyMerged').format({ username: sender });

                context.github.issues.createComment(context.issue({
                  number: pullRequestNumber,
                  body: message
                }));


              }catch(error) {

                // Unable to merge the PR, maybe a merge conflict.
                // https://developer.github.com/v3/pulls/#get-if-a-pull-request-has-been-merged
                console.log(error);
                console.log(JSON.stringify(error));
                let message = strings.get('unableToMergePR');
                context.github.issues.createComment(context.issue({
                  number: pullRequestNumber,
                  body: message
                }));
              }
              
            }
          }

        }
      }

    }
  });
}
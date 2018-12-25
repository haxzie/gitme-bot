const axios = require('axios');
const checker = require('./lib/markdownChecker');

const {
  Wring
} = require('wring-js');
const wring = new Wring();
const strings = wring.load('./lib/strings.yml', __dirname);

module.exports = app => {
  app.log('Yay, the app was loaded!');

  // comment when new issue is opened
  app.on('issues.opened', async context => {
    const issueComment = context.issue({
      body: strings.get('newIssue')
    });
    await context.github.issues.addLabels(context.issue({
      labels: ["Awaiting Review"]
    }));
    return context.github.issues.createComment(issueComment);
  });

  app.on('status', async context => {
    //console.log(JSON.stringify(context));
  });

  app.on(['pull_request.opened', 'pull_request.reopened'], async context => {

    const pullRequest = context.payload.pull_request;
    const creator = pullRequest.user.login;
    const number = pullRequest.number;

    // get the changed file
    const filesResponse = await context.github.pullRequests.listFiles(context.issue({
      number: number
    }));

    if (filesResponse.data.length == 1) {
      let file = filesResponse.data[0];
      // Pull request is added for profile submission, add the label
      if (file.filename.match(/^src\/profiles\//g)) {

        // Add submission label to the Pull request
        await context.github.issues.addLabels(context.issue({
          labels: ["submission"],
          number: number
        }));

        // Add a comment on the pull request
        const submissionComment = context.issue({
          body: strings.with('newSubmission').format({
            username: creator
          })
        });
        await context.github.issues.createComment(submissionComment);

        // retrieve the file and check for proper syntax
        const contents = await axios.get(file.raw_url);
        console.log(contents.data);
        let check_results = checker(contents.data, creator  );
        context.github.issues.createComment(context.issue({
          number: number,
          body: check_results.message
        }));

        // Okay this is kinda wiered API response here
        // the request will result in 404 if the PR isn't merged
        // and 204 if the PR is merged
        if (check_results.merge) {
          // Add approved label to the Pull request
          await context.github.issues.addLabels(context.issue({
            labels: ["approved"],
            number: number
          }));

          try {
            await context.github.pullRequests.checkIfMerged(context.issue({
              number: number
            }));
            console.log("Pull request already merged")
          } catch (error) {
            console.log("Pull request not merged");
            // Let's merge it! Yaay
            try {

              // Status 200 if merged, else unable to merge 
              await context.github.pullRequests.merge(context.issue({
                number: number
              }));

              let message = strings.with('successfullyMerged').format({
                username: creator
              });
          
              return await context.github.issues.createComment(context.issue({
                number: number,
                body: message
              }));

            } catch (error) {

              // Unable to merge the PR, maybe a merge conflict.
              // https://developer.github.com/v3/pulls/#get-if-a-pull-request-has-been-merged
              console.log(error);
              console.log(JSON.stringify(error));
              // Add approved label to the Pull request
              await context.github.issues.addLabels(context.issue({
                labels: ["review required"],
                number: number
              }));
              let message = strings.get('unableToMergePR');
              context.github.issues.createComment(context.issue({
                number: number,
                body: message
              }));
            }

          }
        }
      }
    }
  });

  app.on('pull_request.merged', async context => {
    const pullRequest = context.payload.pull_request;
    const creator = pullRequest.user.login;

    console.log(JSON.stringify(context));
    console.log("Successfully merged the PullRequest!")
    console.log("Sending Congratulations!")

    let message = strings.with('successfullyMerged').format({
      username: creator
    });

    context.github.issues.createComment(context.issue({
      number: number,
      body: message
    }));
  });

  // app.on('check_run.completed', async context => {
  //   console.log(JSON.stringify(context));
  //   const checkSuite = context.payload.check_run;
  //   const checksPRData = await context.github.checks.getSuite(context.issue({
  //       check_suite_id: checkSuite.id
  //   }));
  //   console.log(JSON.stringify(checksPRData));

  //   // check if the checks result is success
  //   if (checkSuite.conclusion !== "success") {
  //     console.error("CheckSuite Failed!");
  //     return;
  //   };

  //   // Checks are all Green, Submit the deploy preview URL
  //   console.log("CheckSuite Success. Creating deploy URL comment...");
  //   //get the PR Number
  // });
}
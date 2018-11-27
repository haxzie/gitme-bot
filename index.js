module.exports = app => {
  app.log('Yay, the app was loaded!')

  app.on('issues.opened', async context => {
    const issueComment = context.issue({ body: 'Thanks for opening this issue!' })
    return context.github.issues.createComment(issueComment)
  })

  app.on('status',  async context => {
    //console.log(JSON.stringify(context));
  });

  app.on('check_suite.completed', async context => {
    const checkSuite = context.payload.check_suite;

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
    const prComment = context.issue({ 
      number: pullRequestNumber,
      body: `Awesome! All checks green :heavy_check_mark:. Checkout the latest [deploy preview](${deployURL}) of this Pull Request.`
    });
    // create the deploy preview comment
    context.github.issues.createComment(prComment);

    // Download the changed file and initialize checks
    console.log("Initialize file checks...");

    const filesResponse = await context.github.pullRequests.listFiles(context.issue({
      number: pullRequestNumber
    }));

    if (filesResponse && filesResponse.status === 200) {
      let files = filesResponse.data.map(file => {
        if (file.filename.match(/src\/profiles\//g)) {
          return file;
        } 
      });

      
    }


    console.log(fileResp);
  })
}

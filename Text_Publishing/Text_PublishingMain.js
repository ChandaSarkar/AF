define(['JobList', 'PublishNewJob', 'Filter', 'JobDetail'], function(JobList, PublishNewJob, Filter, JobDetail) {

    // Job list related functionality starts here
    var JL = new JobList();
    appGlobals.globals.pubsubQueue.subscribe("reinitailizeJobList", JL.generateHTML);
    appGlobals.globals.pubsubQueue.subscribe("resetJobList", JL.resetJobList);
    JL.init();

    // Publish new job related functionality starts here
    var PN = new PublishNewJob();
    PN.init();
    // Venue is dependent on App ID
    appGlobals.globals.pubsubQueue.subscribe("makeVenueCall", PN.makeVenueCall);
    appGlobals.globals.pubsubQueue.subscribe("initailizeVenueList", PN.generateVenueHTML);
    appGlobals.globals.pubsubQueue.subscribe("initailizeJobList", PN.generateJobTypeHTML);
    appGlobals.globals.pubsubQueue.subscribe("nextStepHandler", PN.nextStepHandler);
    appGlobals.globals.pubsubQueue.subscribe("resetJobSteps", PN.resetJobSteps);
    appGlobals.globals.pubsubQueue.subscribe("scheduleJob", PN.scheduleJob);

    // Filter related functionality starts here
    var FT = new Filter();
    FT.init();
    appGlobals.globals.pubsubQueue.subscribe("initailizeJobList", FT.showJobTypeFiltersList);
    appGlobals.globals.pubsubQueue.subscribe("initailizeStatusList", FT.showStatusFiltersList);

    // Viewing job details and edit job related functionality starts here
    var JD = new JobDetail();
    JD.init();
});
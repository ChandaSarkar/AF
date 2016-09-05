define(function() {
    // Setting up Publishing level global methods

    // This method will fetch application list from API
    var getAppList = function(callback) {
        var url = appGlobals.globals.publishingURL + 'get-applications';
        var height = $("body").height();
        height = height - 25;
        $.ajax({
            type: "GET",
            async: true,
            url: url,
            dataType: "json",
            beforeSend: function() {
                $('.ajax-status-icons').show();
            },
            error: function() {
                $('#error-msg').show();
                $('#error-msg').css("height", height);
                $('.ajax-status-icons').hide();
            },
            success: function(data) {
                if (data && typeof (data) === "object" && Object.keys(data).length > 0) {
                    callback(data);
                } else {
                    $('#error-msg').show();
                    $('#error-msg').css("height", height);
                    $('.ajax-status-icons').hide();
                }
            }
        });
    };

    /**
     * This is a globalized standard for ajax calling
     * obj.type: This will determine the type  (POST,GET, etc)
     * obj.async: This will determine asyn is true or false
     * onj.url: This will determine the url of api
     * obj.data: This will determine the object that has been sent to api call
     * obj.ajaxComponent: This will determine extra parameter to pass with the response
     * obj.returnFromError: This will determine of we want to redirect the callback on error
     */
    var ajaxCalling = function(obj, callback) {
        var dataType = "json";
        var result;

        if (obj.dataType) {
            dataType = obj.dataType;
        }
        $.ajax({
            type: obj.type,
            async: obj.async,
            url: obj.url,
            dataType: dataType,
            data: obj.data,
            beforeSend: function() {
                $('.ajax-status-icons').show();
                ++appGlobals.globals.ajaxCallCount;
            },
            error: function(response) {
                var data = jQuery.parseJSON(response.responseText);
                if (data.success === false) {
                    $("#common-error .modal-body b").html(data.message);
                    $("#common-error-link").click();
                }
                if (obj.returnFromError === true) {
                    callback(response);
                }
            },
            success: function(data) {
                result = data;
                if (callback) {
                    if (obj.ajaxComponent) {
                        callback(data, obj.ajaxComponent);
                    } else {
                        callback(data);
                    }
                }
            },
            complete: function() {
                --appGlobals.globals.ajaxCallCount;
                if (appGlobals.globals.ajaxCallCount === 0) {
                    $('.ajax-status-icons').hide();
                }
            }
        });

        return result;
    };

    // This method will display error messages from API
    var displayErrorMessage = function(response) {
        var errorMessage = JSON.parse(response.responseText).message;
        appGlobals.globals.errorMessage(errorMessage, "error");
    };

    // This method will fetch job list as per selected application from API
    var getJobList = function(callback, jobListObj, parameters) {
        var appId = $("#application-name").attr("data-id");
        var nextPage = $(".tab-content").attr("data-page");
        if (!nextPage) {
            $(".tab-content").attr("data-page", "0");
            nextPage = 0;
        }

        var queryString = {"appId": appId, "pageId": nextPage, "filter": parameters.filter, "orderBy": parameters.orderBy, "sort": parameters.sort};
        var url = appGlobals.globals.publishingURL + 'get-application-jobs';

        $.ajax({
            type: "GET",
            async: true,
            url: url,
            dataType: "json",
            data: queryString,
            beforeSend: function() {
                if ($('.ajax-status-icons').is(":visible") === false) {
                    $('.ajax-status-icons').show();
                }
            },
            error: function(response) {
                displayErrorMessage(response);
            },
            success: function(data) {
                if (!nextPage) {
                    jobListObj.jsonResponse = data;
                    callback();
                } else {
                    jobListObj.previousRequestComplete = true;
                    callback({"append": true, "value": data});
                }
            }
        });
    };

    // This method will fetch filter job list as per selected application from API
    var getFilterJobList = function(obj, callback) {
        var result;

        $.ajax({
            type: obj.type,
            async: obj.async,
            url: obj.url,
            dataType: "json",
            data: obj.data,
            beforeSend: function() {
                if ($('.ajax-status-icons').is(":visible") === false) {
                    $('.ajax-status-icons').show();
                }
            },
            error: function(response) {
                displayErrorMessage(response);
            },
            success: function(data) {
                result = data;
                if (callback) {
                    if (obj.ajaxComponent) {
                        callback(data, obj.ajaxComponent);
                    } else {
                        callback(data);
                    }
                }
            }
        });

        return result;
    };

    // This method will fetch venues list as per application ID
    var getVenues = function() {
        var appId = $("#application-name").attr("data-id");
        var url = appGlobals.globals.appbuilderURL + 'get-app-templates';
        var data = {"appId": appId, "type": 'layers'};
        $.ajax({
            type: "GET",
            async: true,
            url: url,
            dataType: "json",
            data: data,
            beforeSend: function() {
                $('.ajax-status-icons').show();
                $('.ajax-status-icons').css('z-index', '11000');
                ++appGlobals.globals.ajaxCallCount;
            },
            error: function(response) {
                displayErrorMessage(response);
            },
            success: function(data) {
                appGlobals.globals.pubsubQueue.publish("initailizeVenueList", data);
            },
            complete: function() {
                --appGlobals.globals.ajaxCallCount;
                if (appGlobals.globals.ajaxCallCount === 0) {
                    $('.ajax-status-icons').hide();
                }
            }
        });
    };

    // This method will create or update a job
    var createNewJob = function(data, callback) {
        var url = appGlobals.globals.publishingURL + 'create-update-job';
        $(".tab-content").attr("data-page", "0");

        $.ajax({
            type: "POST",
            async: true,
            url: url,
            dataType: "json",
            data: data,
            beforeSend: function() {
                $('.ajax-status-icons').show();
            },
            error: function(response) {
                displayErrorMessage(response);
                $('.ajax-status-icons').hide();
            },
            success: function(data) {
                $('.ajax-status-icons').hide();
                if (callback) {
                    callback(data);
                }
                appGlobals.globals.pubsubQueue.publish("resetJobList");
            }
        });
    };

    // This method will create a job with DB upload
    var createNewJobWithDB = function(data, callback) {
        var url = appGlobals.globals.publishingURL + 'create-job-with-db';
        $(".tab-content").attr("data-page", "0");

        $.ajax({
            type: "POST",
            async: true,
            url: url,
            data: data,
            dataType: "json",
            cache: false,
            contentType: false,
            processData: false,
            beforeSend: function() {
                $('.ajax-status-icons').show();
            },
            error: function(response) {
                displayErrorMessage(response);
                $('.ajax-status-icons').hide();
            },
            success: function(data) {
                $('.ajax-status-icons').hide();
                if (callback) {
                    callback(data);
                }

                // Re-initializing job list with updated value
                appGlobals.globals.pubsubQueue.publish("reinitailizeJobList", data);
            }
        });
    };

    // This method will upload database file against specific job
    var uploadDatabase = function(data) {
        var url = appGlobals.globals.publishingURL + 'upload-db';

        $.ajax({
            type: "POST",
            url: url,
            data: data,
            async: true,
            dataType: "json",
            cache: false,
            contentType: false,
            processData: false,
            beforeSend: function() {
                $('.ajax-status-icons').show();
                $('.ajax-status-icons').css("z-index", "100");
            },
            error: function(response) {
                displayErrorMessage(response);
            },
            success: function() {
            },
            complete: function() {
                $('.ajax-status-icons').css("z-index", "0");
                $('.ajax-status-icons').hide();
            }
        });
    };

    // This method will reset all components
    var resetComponant = function() {
        $('form').each(function() {
            this.reset();
        });
        $(".job-type-field").prop('selectedIndex', 0);
    };

    // Configuring require
    require.config({
        waitSeconds: 15,
        baseUrl: appGlobals.globals.jsPath,
        paths: {
            PublishingMain: appGlobals.globals.publishingPath + 'PublishingMain',
            JobList: appGlobals.globals.publishingPath + 'JobList',
            PublishNewJob: appGlobals.globals.publishingPath + 'PublishNewJob',
            Filter: appGlobals.globals.publishingPath + 'Filter',
            JobDetail: appGlobals.globals.publishingPath + 'JobDetail'
        }
    });

    // This method will set up job status to a global variable
    var settingJobStatus = function(data) {
        for (var index = 0; index < data.length; ++index) {
            switch (data[index].name) {
                case "Completed":
                    appGlobals.globals.jobStatus["completed"] = data[index];
                    break;

                case "Pending":
                    appGlobals.globals.jobStatus["pending"] = data[index];
                    break;

                case "In Progress":
                    appGlobals.globals.jobStatus["in_progress"] = data[index];
                    break;

                case "Failed":
                    appGlobals.globals.jobStatus["failed"] = data[index];
                    break;

                case "Paused":
                    appGlobals.globals.jobStatus["paused"] = data[index];
                    break;

                case "Deleted":
                    appGlobals.globals.jobStatus["deleted"] = data[index];
                    break;

                default:
            }
        }
    };

    // Adding Publishing specific object to global object
    appGlobals.globals.getJobList = getJobList;
    appGlobals.globals.getFilterJobList = getFilterJobList;
    appGlobals.globals.getAppList = getAppList;
    appGlobals.globals.getVenues = getVenues;
    appGlobals.globals.settingJobStatus = settingJobStatus;
    appGlobals.globals.createNewJob = createNewJob;
    appGlobals.globals.createNewJobWithDB = createNewJobWithDB;
    appGlobals.globals.uploadDatabase = uploadDatabase;
    appGlobals.globals.resetComponant = resetComponant;
    appGlobals.globals.ajaxCalling = ajaxCalling;
    appGlobals.globals.ajaxCallCount = 0;
    appGlobals.globals.jobStatus = {};

    require(['PublishingMain']);
});
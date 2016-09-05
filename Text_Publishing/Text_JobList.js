define(function() {

    // Declaring class that contains all method for job list
    var JobList = function() {
        var self = this;
        this.isEvenRegistered = false;
        this.jsonResponse = [];
        this.recordCount;
        this.previousRequestComplete = true;
        var isSafari = /Safari/.test(navigator.userAgent) && /Apple Computer/.test(navigator.vendor);
        var appObj = '';

        if (isSafari) {
            $("#job-list-table td .btn-group").css("white-space", "nowrap !important");
        }

        // This method will give last publish time
        var getLastPublishTime = function(node) {
            return node.updated || node.schedule || node.created;
        };

        // This method will populate job list.
        var prepopulateJobList = function(response) {
            var pageIndex = $("#job-list-table").attr("data-page");
            self.previousRequestComplete = true;
            if (!parseInt(pageIndex)) {
                $("#job-list-table tbody").html('');
            }
            if (!parseInt(pageIndex) && response.length < 1) {
                $('#job-list-table tbody').html('<tr><td colspan="4" class="no-records">&nbsp;&nbsp;No jobs available.</td></tr>');
                $('.ajax-status-icons').hide();
                return false;
            }
            var jobListTemplate = $("#job-list").html();
            Mustache.tags = ['{|', '|}'];

            for (var index = 0; index < response.length; ++index) {
                var node = response[index];
                var newTemplate = jobListTemplate;
                var table = '#job-list-table';
                var dateTime;
                var localDateTime;
                var publishTime;

                // Check for job status
                $(table + " tbody").append(Mustache.render(newTemplate, node));

                // This POC will add object to each job node which will be further used
                $(table).find(" #" + node.id).data("property", node);

                var fileName = node.name;
                if (fileName.length > 30) {
                    fileName = fileName.substring(0, 30);
                    fileName = fileName + "...";
                }
                $("#" + node.id).find(".name-value .job-title").attr("title", node.name);
                $("#" + node.id).find(".name-value .job-title span:nth-child(2)").html(fileName);
                publishTime = getLastPublishTime(node);

                // Converting to Local Date Time
                if (publishTime && publishTime.toLowerCase().indexOf("z") === -1) {
                    dateTime = publishTime + "Z";
                } else {
                    dateTime = publishTime;
                }

                localDateTime = new Date(dateTime);
                if (localDateTime.toLocaleString().toLowerCase() !== "invalid date") {
                    var minuteString = localDateTime.toLocaleTimeString().split(":");
                    localDateTime = localDateTime.getMonth() + 1 + "/" + localDateTime.getDate() + "/" +
                            localDateTime.getFullYear() + " @ " + minuteString[0] + ":" + minuteString[1] + " " +
                            localDateTime.toLocaleTimeString().split(' ')[1].toUpperCase();
                } else {
                    localDateTime = localDateTime.toLocaleString();
                }
                $(table).find(" #" + node.id).find('.job-time span.formats').html(localDateTime);

                if (node.status.name === appGlobals.globals.jobStatus.paused.name) {
                    $("#" + node.id).find('td ul li a.status').html("Resume Job");
                } else {
                    $("#" + node.id).find('td ul li a.status').html("Pause Job");
                }
            }

            if (appGlobals.globals.isRetina) {
                var favoriteElement = ".publishing .job-list-table tr td:first-child .favorite-icon img";
                appGlobals.globals.updateRetinaImageName(favoriteElement);
                var recurringElement = ".publishing .job-list-table tr td:first-child .favorite-icon img";
                appGlobals.globals.updateRetinaImageName(recurringElement);
            }
            $('.ajax-status-icons').hide();
            return false;
        };

        // This method will generate HTML for job list
        this.generateHTML = function(response) {
            self.jsonResponse = response;
            self.recordCount = response.length;
            prepopulateJobList(self.jsonResponse);
        };

        // This method will get job list.
        var generatePublisherJobList = function(data) {
            var jobListObject = {};

            jobListObject.type = "GET";
            jobListObject.async = true;
            jobListObject.dataType = 'json';
            jobListObject.url = appGlobals.globals.publishingURL + 'get-application-jobs';
            jobListObject.data = data;
            appGlobals.globals.ajaxCalling(jobListObject, self.generateHTML);
        };

        // This method will search smart form list.
        var getSearchJobListResult = function(searchBy, pageIndex, orderBy, sort) {
            var jobInfoObject = {};
            var appId = $("#application-name").attr("data-id");
            var data = {"appId": appId, "searchBy": searchBy, "pageIndex": pageIndex, "orderBy": orderBy, "sort": sort};
            jobInfoObject.type = "GET";
            jobInfoObject.async = true;
            jobInfoObject.dataType = 'json';
            jobInfoObject.data = data;
            jobInfoObject.url = appGlobals.globals.publishingURL + 'search-job';
            appGlobals.globals.ajaxCalling(jobInfoObject, prepopulateJobList);
        };

        // This method will generate HTML for cme id drop-down
        var generateCmeListHTML = function(cmeList) {
            if (cmeList) {
                cmeList = {'value': cmeList};
                Mustache.tags = ["{|", "|}"];
                var selectListTemplate = $("#cme-type-list").html();
                $(".step-2 section[data-sub-step='3'] select").append(Mustache.render(selectListTemplate, cmeList));
            } else {
                var obj = {};
                obj.type = "GET";
                obj.async = true;
                obj.url = appGlobals.globals.publishingURL + "get-containers";

                appGlobals.globals.ajaxCalling(obj, generateCmeListHTML);
            }
        };

        // This method will fetch job statues
        var getJobStatues = function(response) {
            if (response) {
                appGlobals.globals.settingJobStatus(response);
                appGlobals.globals.pubsubQueue.publish("initailizeStatusList", response);
            } else {
                var JobStatusObject = {};
                JobStatusObject.type = "GET";
                JobStatusObject.async = false;
                JobStatusObject.dataType = 'json';
                JobStatusObject.url = appGlobals.globals.publishingURL + 'get-job-statuses';
                appGlobals.globals.ajaxCalling(JobStatusObject, getJobStatues);
            }
        };

        // This method will fetch all job types
        var fetchJobTypes = function(response) {
            if (response) {
                appGlobals.globals.pubsubQueue.publish("initailizeJobList", response);
            } else {
                // Give API request to fetch job types
                var platform = $("#application-name").attr("data-platform");

                var jobTypeObject = {};
                jobTypeObject.type = "GET";
                jobTypeObject.async = true;
                jobTypeObject.dataType = 'json';
                jobTypeObject.url = appGlobals.globals.publishingURL + 'get-job-types';
                jobTypeObject.data = "platform=" + platform;
                appGlobals.globals.ajaxCalling(jobTypeObject, fetchJobTypes);
            }
        };

        // This method will fetch app version
        var getAppVersion = function(appObj) {
            var appId = $('input[name=session-app-id]').val();
            appId = appId ? appId : appObj[0].maasId;

            return appId;
        };

        // This method will generate HTML tags for app list using mustache
        var appList = function(data) {
            appObj = data;
            var appId = getAppVersion(appObj);

            // If app Id exists in session then set is default set
            var imgResponsive = $("#application-name .img-responsive");
            if (appGlobals.globals.sessionAppId) {
                $("#application-name").attr("data-id", appGlobals.globals.sessionAppId);
                $.map(data, function(item) {
                    if (item.maasId === parseInt(appGlobals.globals.sessionAppId)) {
                        $("#application-name .selected-name").html(item.name);
                        $("#application-name").attr("data-platform", item.afPlatform);

                        // Assign application OS icon to element
                        $(imgResponsive).attr('src', appGlobals.globals.coreImgPath + item.OS + '-appbuilder.png');

                        // If retina display then replace application os icon with its 2x counterpart
                        if (appGlobals.globals.isRetina) {
                            displayRetinaImg(imgResponsive, 'app-builder');
                        }
                    }
                });
            } else {
                // Else set first app as default app
                $("#application-name .selected-name").html(data[0].name);
                $("#application-name").attr("data-id", data[0].maasId);
                $("#application-name").attr("data-platform", data[0].afPlatform);

                // Assign application OS icon to element
                $(imgResponsive).attr('src', appGlobals.globals.coreImgPath + data[0].OS + '-appbuilder.png');

                // If retina display then replace application os icon with its 2x counterpart
                if (appGlobals.globals.isRetina) {
                    displayRetinaImg(imgResponsive, 'app-builder');
                }
            }

            var appPlatform = parseInt($("#application-name").attr('data-platform'));
            var radioButton = $('.step-3 .job-frequency');
            $(radioButton).find('[type="radio"][value="once"]').prop("checked", true);
            if (appPlatform < 4) {
                $(radioButton).find('[type="radio"][value="recurring"]').next().hide();
                $(radioButton).find('[type="radio"][value="recurring"]').hide();
            } else {
                $(radioButton).find('[type="radio"][value="recurring"]').next().show();
                $(radioButton).find('[type="radio"][value="recurring"]').show();
            }

            var mustacheData = [];

            // Add extra element to array to identify if application OS is iOS or Android
            $.map(data, function(item) {
                if (item.OS === 'ios') {
                    item.ios = true;
                } else {
                    item.ios = false;
                }
                mustacheData.push(item);
            });

            // Common Code
            data = {"value": mustacheData};
            var selectappListTemplate = $("#app-list").html();
            Mustache.tags = ['{|', '|}'];
            $('.app-list').html(Mustache.render(selectappListTemplate, data));

            fetchJobTypes();

            // API calling to get job status list
            getJobStatues();

            // API calling to get cme id list
            generateCmeListHTML();

            $("#job-list-table").attr("data-page", 0);
            $("#job-list-table").attr("data-sort", 2);
            $("#job-list-table").attr("data-order", 3);

            var pageIndex = $("#job-list-table").attr("data-page");
            var sort = $("#job-list-table").attr("data-sort");
            var orderBy = $("#job-list-table").attr("data-order");

            var inputData = {"appId": appId, "pageId": pageIndex, "orderBy": orderBy, "sort": sort};
            generatePublisherJobList(inputData);

            // Initialize venue list using publisher subscriber
            appGlobals.globals.pubsubQueue.publish("makeVenueCall");

            // If retina display then replace all application os icons with their 2x counterpart
            if (appGlobals.globals.isRetina) {
                displayRetinaImg('.dropdown-menu.app-list li', 'app-builder');
            }
        };

        // This object contains list of all constants used in this js file
        var constants = {
            VERTICAL_ELLIPSES: appGlobals.globals.imgPath + 'overflow_dots.png',
            VERTICAL_ELLIPSES_HOVER: appGlobals.globals.imgPath + 'overflow_dots_hover.png',
            RECURRING_ERROR_LOGO: appGlobals.globals.imgPath + appGlobals.globals.publishingPath + 'red_icon.png',
            ONEOFF_COMPLETED_LOGO: appGlobals.globals.imgPath + appGlobals.globals.publishingPath + 'tickmark_icon.png',
            ONEOFF_SCHEDULED_LOGO: appGlobals.globals.imgPath + appGlobals.globals.publishingPath + 'timer_icon.png',
            PAUSE_JOB_LOGO: appGlobals.globals.imgPath + appGlobals.globals.publishingPath + 'pause_icon.png',
            GREEN_ICON_LOGO: appGlobals.globals.imgPath + appGlobals.globals.publishingPath + 'green_icon.png',
            PAUSE_JOB: 'Pause Job',
            RESUME_JOB: 'Resume Job'
        };

        // This object contains list of all callbacks
        var callbacks = {
            // This method will add look and feel for active row on mouseover
            clbkJobMouseover: function() {
                $(this).find('#inner-div img').attr("src", constants.VERTICAL_ELLIPSES_HOVER);
            },
            // This method will remove look and feel for active row on mouseout
            clbkJobMouseout: function() {
                $(this).find('#inner-div img').attr("src", constants.VERTICAL_ELLIPSES);
            },
            // This method will update favorite/unfavorite job.
            clbkUpdateFavoriteJob: function(response) {
                var jobId = response.jobId;
                if ($("#" + jobId + " .job-title .retina-icon img").is(":visible") === true) {
                    $("#" + jobId).find(".job-title .favorite-icon img").hide();
                    $("#" + jobId).find(".actions-value .btn-group ul li .favorite").html("Favorite Job");
                } else {
                    $("#" + jobId).find(".job-title .favorite-icon img").show();
                    $("#" + jobId).find(".actions-value .btn-group ul li .favorite").html("Unfavorite Job");
                }
            },
            // This method will add or remove job from favorite/unfavorite list
            clbkAddRemoveFavorite: function() {
                var appId = $("#application-name").attr("data-id");
                var jobId = $(this).attr("data-id");
                var jobType = $(this).html();
                var url = appGlobals.globals.publishingURL + 'create-update-job';
                var updateJobObject = {};
                var objJobDetails = {};

                if (jobType === "Favorite Job") {
                    objJobDetails.favorite = true;
                } else {
                    objJobDetails.favorite = false;
                }
                var data = {appId: appId, jobId: jobId, jobInfo: JSON.stringify(objJobDetails)};
                updateJobObject.type = "POST";
                updateJobObject.async = true;
                updateJobObject.dataType = 'json';
                updateJobObject.url = url;
                updateJobObject.data = data;
                appGlobals.globals.ajaxCalling(updateJobObject, callbacks.clbkUpdateFavoriteJob);
            },
            // This method will confirm deleting a job from list
            clbkDeleteConfirmationJob: function() {
                var jobId = $(this).attr("data-id");
                $("#hidden-job-id").val(jobId);
            },
            // This method will remove deleted record from table list.
            clbkRemoveDeletedRecords: function(response) {
                var jobId = response.jobId;
                $("#" + jobId).remove();
                if ($(".job-detail-page").is(":visible") === true) {
                    $(".job-detail-page").hide('slide', {direction: 'right'}, 500);
                }
            },
            // This method will delete a job from list
            clbkDeleteJob: function() {
                var jobId = $("#hidden-job-id").val();
                $("#common-alert .close").click();
                var obj = {};
                obj.type = "POST";
                obj.async = true;
                obj.url = appGlobals.globals.publishingURL + "delete-job";
                obj.data = "jobId=" + jobId;
                appGlobals.globals.ajaxCalling(obj, callbacks.clbkRemoveDeletedRecords);
            },
            // This method will run a job from list
            clbkRunJob: function() {
                var jobId = $(this).attr("data-id");
                var url = appGlobals.globals.publishingURL + "run-job";
                var runJobObject = {};
                runJobObject.type = "POST";
                runJobObject.async = true;
                runJobObject.dataType = 'json';
                runJobObject.url = url;
                runJobObject.data = {"jobId": jobId};
                appGlobals.globals.ajaxCalling(runJobObject, callbacks.clbkResetSearchJobList);
            },
            //This function will update status label
            clbkChangeStatusLabel: function(response) {
                var jobId = response.jobId;
                if ($.trim($("#" + jobId + " td.status-value .job-status").html()) === "Pending") {
                    $("#" + jobId + " td.status-value .job-status").html("Paused");
                    $("#" + jobId).find(".actions-value .btn-group ul li .status").html("Resume Job");
                } else {
                    $("#" + jobId + " td.status-value .job-status").html("Pending");
                    $("#" + jobId).find(".actions-value .btn-group ul li .status").html("Pause Job");
                }
            },
            // This method will pause and resume a job from list
            clbkChangeStatus: function() {
                var element = $(this);
                var jobId = $(element).attr("data-id");
                var appId = $("#application-name").attr("data-id");
                var statusId;
                var data;

                if ($(this).html() === "Pause Job") {
                    statusId = {"statusId": appGlobals.globals.jobStatus.pending.id};
                } else if ($(this).html() === "Resume Job") {
                    statusId = {"statusId": appGlobals.globals.jobStatus.paused.id};
                }
                data = {appId: appId, jobId: jobId, jobInfo: JSON.stringify(statusId)};
                var jobListObject = {};
                jobListObject.type = "POST";
                jobListObject.async = true;
                jobListObject.dataType = 'json';
                jobListObject.url = appGlobals.globals.publishingURL + "create-update-job";
                jobListObject.data = data;
                appGlobals.globals.ajaxCalling(jobListObject, callbacks.clbkChangeStatusLabel);
            },
            // This method will initiate search on hitting enter
            clbkSearchEntity: function(response) {
                var appId = $("#application-name").attr("data-id");
                if (response.type === "click" || response.type === "keyup") {
                    $("#job-list-table").attr("data-page", 0);
                    $("#job-list-table").attr("data-sort", 2);
                    $("#job-list-table").attr("data-order", 3);
                    var code = response.keyCode || response.which;
                    var searchBy = $.trim($(".publishing .search-form .form-control").val());
                    if (!searchBy && response.type === "click") {
                        return false;
                    }
                    var pageIndex = $("#job-list-table").attr("data-page");
                    var sort = $("#job-list-table").attr("data-sort");
                    var orderBy = $("#job-list-table").attr("data-order");
                    $(".job-list-table.job-list-head tr th i").addClass("fa-caret-down").removeClass("fa-caret-up");
                    $(".job-list-table thead tr th i").addClass("hide");
                    $(".job-list-table thead tr th.run-time i").removeClass("hide");
                    if (code === 13 || response.type === "click") {
                        if (searchBy === "") {
                            $(".publishing #search-btn").removeClass("icon-remove");
                            $(".publishing #search-btn").addClass("icon-search");
                            $(".publishing .search-form .form-control").val('');
                            var data = {"appId": appId, "pageId": pageIndex, "orderBy": orderBy, "sort": sort};
                            generatePublisherJobList(data);
                        } else {
                            $(".publishing #search-btn").removeClass("icon-search");
                            $(".publishing #search-btn").addClass("icon-remove");
                            getSearchJobListResult(searchBy, pageIndex, orderBy, sort);
                        }
                    }
                }
            },
            // This function will refresh job list
            clbkResetSearchJobList: function() {
                var appId = $("#application-name").attr("data-id");

                $('#filter-jobs ul li input').prop('checked', false);
                $("i#search-btn").removeClass("icon-remove");
                $("i#search-btn").addClass("icon-search");
                $(".publishing .search-form .form-control").val('');
                $(".job-list-table.job-list-head tr th i").addClass("fa-caret-down").removeClass("fa-caret-up");
                $(".job-list-table thead tr th i").addClass("hide");
                $(".job-list-table thead tr th.run-time i").removeClass("hide");
                $("#job-list-table tbody").html('');
                $("#job-list-table").attr("data-page", 0);
                $("#job-list-table").attr("data-sort", 2);
                $("#job-list-table").attr("data-order", 3);

                var pageIndex = $("#job-list-table").attr("data-page");
                var sort = $("#job-list-table").attr("data-sort");
                var orderBy = $("#job-list-table").attr("data-order");
                var data = {"appId": appId, "pageId": pageIndex, "orderBy": orderBy, "sort": sort};
                generatePublisherJobList(data);
            },
            // This method contains pagination logic
            clbkPagination: function() {
                var appId = $("#application-name").attr("data-id");
                var scrollTop = $(this).scrollTop();
                var innerHeight = $(this).innerHeight();
                var total = scrollTop + innerHeight;
                var scrollHeight = this.scrollHeight;
                var sort = $("#job-list-table").attr("data-sort");
                var orderBy = $("#job-list-table").attr("data-order");

                $(".table tbody td .open .dropdown-toggle").click();
                if (total < scrollHeight) {
                    return false;
                }
                var searchBy = $.trim($(".publishing-content .search-form input").val());
                var filterData = callbacks.clbkJobListFilter();
                if (self.recordCount === 20 && self.previousRequestComplete === true) {
                    var nextPage = parseInt($("#job-list-table").attr("data-page"));
                    self.previousRequestComplete = false;
                    ++nextPage;
                    $("#job-list-table").attr("data-page", nextPage);

                    if (searchBy !== "") {
                        getSearchJobListResult(searchBy, nextPage, orderBy, sort);
                        return false;
                    } else if (filterData) {
                        var data = {"appId": appId, "pageId": nextPage, "orderBy": orderBy, "sort": sort, "filters": JSON.stringify(filterData)};
                        var jobListObject = {};
                        jobListObject.type = "GET";
                        jobListObject.async = true;
                        jobListObject.dataType = 'json';
                        jobListObject.url = appGlobals.globals.publishingURL + 'filter-job';
                        jobListObject.data = data;
                        appGlobals.globals.ajaxCalling(jobListObject, prepopulateJobList);
                    } else {
                        var data = {"appId": appId, "pageId": nextPage, "orderBy": orderBy, "sort": sort};
                        generatePublisherJobList(data);
                    }
                }
            },
            clbkJobListSorting: function() {
                var appId = $("#application-name").attr("data-id");
                var sort = 2;
                var searchBy = $.trim($(".publishing-content .search-form input").val());
                var pageId = 0;
                var orderBy = $(this).attr("data-id");
                var records = $("#job-list-table tr").length;

                if (records <= 1) {
                    return false;
                }

                if (!orderBy) {
                    return false;
                }
                $("#job-list-table tbody").html('');
                $(".job-list-table thead tr th i").addClass("hide");
                if ($(this).find("i").hasClass("fa-caret-down")) {
                    $(".job-list-table.job-list-head tr th i").addClass("fa-caret-down").removeClass("fa-caret-up");
                    sort = 1;
                    $(this).find("i").removeClass("fa-caret-down").addClass("fa-caret-up");
                } else {
                    $(".job-list-table.job-list-head tr th i").addClass("fa-caret-down").removeClass("fa-caret-up");
                    $(this).find("i").removeClass("fa-caret-up").addClass("fa-caret-down");
                }

                $(this).find("i").removeClass("hide");
                var filterData = callbacks.clbkJobListFilter();
                $("#job-list-table").attr("data-sort", sort);
                $("#job-list-table").attr("data-order", orderBy);
                $("#job-list-table").attr("data-page", 0);
                if (searchBy !== "") {
                    getSearchJobListResult(searchBy, pageId, orderBy, sort);
                } else if (filterData) {
                    var data = {"appId": appId, "pageId": pageId, "orderBy": orderBy, "sort": sort, "filters": JSON.stringify(filterData)};
                    var jobListObject = {};
                    jobListObject.type = "GET";
                    jobListObject.async = true;
                    jobListObject.dataType = 'json';
                    jobListObject.url = appGlobals.globals.publishingURL + 'filter-job';
                    jobListObject.data = data;
                    appGlobals.globals.ajaxCalling(jobListObject, prepopulateJobList);
                } else {
                    var data = {"appId": appId, "pageId": pageId, "orderBy": orderBy, "sort": sort};
                    generatePublisherJobList(data);
                }
            },
            // This function will create filter array.
            clbkJobListFilter: function() {
                var status = [];
                var types = [];
                var kinds = [];
                var i = 0;
                var j = 0;
                var k = 0;

                $('.status-type li input:checkbox:checked').each(function() {
                    status[i] = $(this).val();
                    i++;
                });
                $('.filter-type li input:checkbox:checked').each(function() {
                    types[j] = $(this).val();
                    j++;
                });
                $('.job-class ul li input:checkbox:checked').each(function() {
                    kinds[k] = parseInt($(this).val());
                    k++;
                });
                var inputData = {"statuses": status, "types": types, "kinds": kinds};
                var statusLength = inputData.statuses.length;
                var typesLength = inputData.types.length;
                var kindsLength = inputData.kinds.length;
                if (statusLength || typesLength || kindsLength) {
                    return inputData;
                }
                return 0;
            },
            // This method will push selected filters and show them
            clbkSaveFilters: function() {
                var appId = $("#application-name").attr("data-id");

                $(".publishing-content .search-form input").val('');
                $(".publishing #search-btn").addClass("icon-search");
                $(".publishing #search-btn").removeClass("icon-remove");
                $(".job-list-table.job-list-head tr th i").addClass("fa-caret-down").removeClass("fa-caret-up");
                $(".job-list-table thead tr th i").addClass("hide");
                $(".job-list-table thead tr th.run-time i").removeClass("hide");
                $("#job-list-table").attr("data-sort", 2);
                $("#job-list-table").attr("data-order", 3);
                $("#job-list-table").attr("data-page", 0);
                var filterData = callbacks.clbkJobListFilter();
                if (filterData) {
                    var data = {"appId": appId, "pageId": 0, "orderBy": 3, "sort": 2, "filters": JSON.stringify(filterData)};
                    var jobListObject = {};
                    jobListObject.type = "GET";
                    jobListObject.async = true;
                    jobListObject.dataType = 'json';
                    jobListObject.url = appGlobals.globals.publishingURL + 'filter-job';
                    jobListObject.data = data;
                    appGlobals.globals.ajaxCalling(jobListObject, prepopulateJobList);
                } else {
                    $(".clear-filter").click();
                }
                $('#filter-jobs .close').click();
            },
            // This method will clear jobs filter.
            clbkClearFilters: function() {
                $('.publishing-content').show();
                $('.publishing-content.filter').hide();
                $('#filter-jobs .close').click();
                callbacks.clbkResetSearchJobList();
            },
            clbkdropDownFixPosition: function() {
                var dropdown = $(this).parent().find(".dropdown-menu");
                var dropDownTop = $(this).offset().top + $(this).outerHeight();
                dropdown.css('top', dropDownTop + "px");
                dropdown.css('left', $(this).offset().left + "px");
            },
            // This method will display the job list as per selected app
            clbkAppChange: function() {
                var name = $(this).find(".name").html();
                var img = $(this).find("img").attr("src");
                var appId = $(this).attr("data-id");
                var platform = $(this).attr("data-platform");

                $("#application-name .selected-name").html(name);
                $("#application-name img").attr("src", img);
                $("#application-name").attr("data-id", appId);
                $("#application-name").attr("data-platform", platform);

                var radioButton = $('.step-3 .job-frequency');
                $(radioButton).find('[type="radio"][value="once"]').prop("checked", true);
                if (parseInt(platform) < 4) {
                    $(radioButton).find('[type="radio"][value="recurring"]').next().hide();
                    $(radioButton).find('[type="radio"][value="recurring"]').hide();
                } else {
                    $(radioButton).find('[type="radio"][value="recurring"]').next().show();
                    $(radioButton).find('[type="radio"][value="recurring"]').show();
                }

                // Re-intializing search text and filter
                $(".search-form input").val('');
                $("#clearfilter").click();

                // Call API calling to get job list as per selected application
                $(".job-list-table").attr("data-page", 0);
                $(".job-list-table").attr("data-sort", 2);

                fetchJobTypes();

                var jobListObject = {};

                jobListObject.type = "GET";
                jobListObject.async = true;
                jobListObject.dataType = 'json';
                jobListObject.url = appGlobals.globals.publishingURL + 'get-application-jobs';
                jobListObject.data = {"appId": appId, "pageId": 0, "filter": 0, "orderBy": 3, "sort": 2};
                appGlobals.globals.ajaxCalling(jobListObject, self.generateHTML);
                appGlobals.globals.pubsubQueue.publish("makeVenueCall");
            },
            // This method will be called as window is resized to adjust container height
            clbkContainerResize: function() {
                var calculatedHeight = $(window).innerHeight() -
                        (parseInt($(".main-content-padding").css('margin-bottom')) +
                                parseInt($(".main-content-padding").css('margin-top')) +
                                $(".publishing-header").height() +
                                parseInt($(".publishing-header").css('padding-bottom')) +
                                $(".nav.nav-tabs").height() + $(".filter-btn").height() +
                                parseInt($(".filter-btn").css("padding-top")) +
                                parseInt($(".filter-btn").css("padding-bottom")) +
                                parseInt($(".tab-content").css('padding-top')) +
                                parseInt($(".tab-content").css('padding-bottom'))) - 46;

                $(".tab-content").css("height", calculatedHeight);
            }
        };

        // This method will call 'clbkResetSearchJobList' method using pub-sub
        this.resetJobList = function() {
            callbacks.clbkResetSearchJobList();
        };

        // This method will bind callbacks to events
        var registerEvents = function() {
            $('#job-list-table.table').on('mouseover', 'tbody tr', callbacks.clbkJobMouseover);
            $('#job-list-table.table').on('mouseout', 'tbody tr', callbacks.clbkJobMouseout);
            $('#job-list-table.table, .job-detail-page').on('click', '.run-job', callbacks.clbkRunJob);
            $('#job-list-table.table').on('click', '.add-to-favorite', callbacks.clbkAddRemoveFavorite);
            $('#job-list-table.table').on('click', '.remove-from-favorite', callbacks.clbkAddRemoveFavorite);
            $('#job-list-table').on('click', '.delete-job', callbacks.clbkDeleteConfirmationJob);// Delete from job list page
            $('.edit-job').on('click', '.delete-job', callbacks.clbkDeleteConfirmationJob);//Delete from job details page.
            $("#delete-jobs").on("click", callbacks.clbkDeleteJob);
            $(".app-list").on("click", "li", callbacks.clbkAppChange);
            $('.search-form').on('keyup', 'input.form-control', callbacks.clbkSearchEntity);
            $('.search-form').on('click', '.icon-search#search-btn', callbacks.clbkSearchEntity);
            $('.search-form').on('click', '#search-btn.icon-remove', callbacks.clbkResetSearchJobList);
            $('.publishing-content .section-body').on('scroll', callbacks.clbkPagination);
            $(".job-list-table thead").on("click", 'tr th', callbacks.clbkJobListSorting);
            $('#job-list-table').on('click', '.status', callbacks.clbkChangeStatus);
            $('#filter-jobs').on('click', '.save-filters', callbacks.clbkSaveFilters);
            $('#filter-jobs').on('click', '.clear-filter', callbacks.clbkClearFilters);
            $('.table tbody').on('click', 'td .dropdown-toggle', callbacks.clbkdropDownFixPosition);
            $(window).resize(callbacks.clbkContainerResize);
        };

        // This is a startup method for job list
        this.init = function() {
            if (self.isEvenRegistered === false) {
                registerEvents();
                self.isEvenRegistered = true;
            }
            var height = $("body").height();
            var listSection = height - 323;
            $(".publishing .publishing-content .section-body").css("height", listSection);
            appGlobals.globals.getAppList(appList);
            callbacks.clbkContainerResize();
        };
    };

    return JobList;
});
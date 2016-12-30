/*
 * Cerberus  Copyright (C) 2013  vertigo17
 * DO NOT ALTER OR REMOVE COPYRIGHT NOTICES OR THIS FILE HEADER.
 *
 * This file is part of Cerberus.
 *
 * Cerberus is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Cerberus is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Cerberus.  If not, see <http://www.gnu.org/licenses/>.
 */

$.when($.getScript("js/pages/global/global.js")).then(function () {
    $(document).ready(function () {

        $(window).bind('beforeunload', function () {
            if (getModif()) {
                return true; //Display alert Message that a modification has been done
            }
        });

        var doc = new Doc();
        var stepList = [];

        initPageModal("testCaseScript");

        // Load invariant list into local storage.
        getSelectInvariant("ACTION", false, true);
        getSelectInvariant("CONTROL", false, true);
        getSelectInvariant("CTRLFATAL", false, true);
        getSelectInvariant("PROPERTYTYPE", false, true);
        getSelectInvariant("PROPERTYDATABASE", false, true);
        getSelectInvariant("PROPERTYNATURE", false, true);
        getSelectInvariant("ACTIONFORCEEXESTATUS", false, true);

        loadLibraryStep();
        bindToggleCollapse();

        var test = GetURLParameter("test");
        var testcase = GetURLParameter("testcase");
        var step = GetURLParameter("step");
        var property = GetURLParameter("property");

        $("#runOld").parent().attr("href", "./TestCase.jsp?Test=" + test + "&TestCase=" + testcase + "&Load=Load");

        displayHeaderLabel(doc);
        displayGlobalLabel(doc);
        displayFooter(doc);

        displayPageLabel(doc);

        $("#addStepModal [name='buttonAdd']").html(doc.getDocLabel("page_global", "btn_add"));

        displayInvariantList("conditionOper", "TESTCASECONDITIONOPER", false);
        displayInvariantList("group", "GROUP", false, true);
        displayInvariantList("status", "TCSTATUS", false, true);
        displayInvariantList("priority", "PRIORITY", false, true);
        $('[name="origin"]').append('<option value="All">' + doc.getDocLabel("page_global", "lbl_all") + '</option>');
        displayInvariantList("origin", "ORIGIN", false, true);
        displayInvariantList("active", "TCACTIVE", false, true);
        displayInvariantList("activeQA", "TCACTIVE", false, true);
        displayInvariantList("activeUAT", "TCACTIVE", false, true);
        displayInvariantList("activeProd", "TCACTIVE", false, true);
        displayApplicationList("application", getUser().defaultSystem);
        displayProjectList("project");
        tinymce.init({
            selector: ".wysiwyg"
        });

        $.ajax({
            url: "ReadTest",
            async: true,
            success: function (data) {
                data.contentTable.sort(function (a, b) {
                    var aa = a.test.toLowerCase();
                    var bb = b.test.toLowerCase();
                    if (aa > bb) {
                        return 1;
                    } else if (aa < bb) {
                        return -1;
                    }
                    return 0;
                });
                $(".testTestCase #test").prepend("<option value=''>" + doc.getDocLabel("page_testcasescript", "select_test") + "</option>");
                for (var i = 0; i < data.contentTable.length; i++) {
                    $(".testTestCase #test").append("<option value='" + data.contentTable[i].test + "'>" + data.contentTable[i].test + " - " + data.contentTable[i].description + "</option>");
                }

                if (test != null) {
                    $(".testTestCase #test option[value='" + test + "']").prop('selected', true);
                }
                $(".testTestCase #test").bind("change", function (event) {
                    window.location.href = "./TestCaseScript.jsp?test=" + $(this).val();
                });
                $(".testTestCase #test").select2({width: "100%"}).next().css("margin-bottom", "7px");
            }
        });

        if (test != null) {
            $.ajax({
                url: "ReadTestCase?test=" + test,
                async: true,
                success: function (data) {
                    data.contentTable.sort(function (a, b) {
                        var aa = a.testCase.toLowerCase();
                        var bb = b.testCase.toLowerCase();
                        if (aa > bb) {
                            return 1;
                        } else if (aa < bb) {
                            return -1;
                        }
                        return 0;
                    });
                    $("#testCaseSelect").prepend("<option value=''>" + doc.getDocLabel("page_testcasescript", "select_testcase") + "</option>");
                    for (var i = 0; i < data.contentTable.length; i++) {
                        $("#testCaseSelect").append("<option value='" + data.contentTable[i].testCase + "'>" + data.contentTable[i].testCase + " - " + data.contentTable[i].description + "</option>")
                    }
                    if (testcase != null) {
                        $("#testCaseSelect option[value='" + testcase + "']").prop('selected', true);
                    }
                    $("#testCaseSelect").bind("change", function (event) {
                        window.location.href = "./TestCaseScript.jsp?test=" + test + "&testcase=" + $(this).val();
                    });
                    $("#testCaseSelect").select2({width: '100%'});
                }
            });
        }
        if (test != null && testcase != null) {
            // Edit TestCase open the TestCase Modal
            $("#editTcInfo").click(function () {
                editTestCaseClick(test, testcase);
            });

            $("#deleteTestCase").click(function () {
                removeTestCaseClick(test, testcase);
            });

            $("#TestCaseButton").show();
            $("#tcBody").show();

            var json;
            var testcaseinfo;
            var Tags;
            $.ajax({
                url: "ReadTestCase",
                data: {test: test, testCase: testcase, withStep: true},
                dataType: "json",
                success: function (data) {

                    testcaseinfo = data.info;
                    loadTestCaseInfo(data.info);
                    json = data.stepList;
                    sortData(json);
                    createStepList(json, stepList, step, data.hasPermissionsUpdate);
                    var inheritedProperties = drawInheritedProperty(data.inheritedProp);

                    listenEnterKeypressWhenFocusingOnDescription();
                    setPlaceholderAction();
                    setPlaceholderControl();

                    var propertiesPromise = loadProperties(test, testcase, data.info, property, data.hasPermissionsUpdate);
                    var objectsPromise = loadApplicationObject(data);

                    Promise.all([propertiesPromise, objectsPromise]).then(function (data2) {
                        var properties = data2[0];
                        var availableObjects = data2[1];
                        var availableProperties = properties.concat(inheritedProperties.filter(function (item) {
                            return properties.indexOf(item) < 0;
                        }));
                        var availableObjectProperties = [
                            "value",
                            "picturepath",
                            "pictureurl"
                        ];
                        var availableSystemValues = [
                            "SYSTEM",
                            "APPLI",
                            "BROWSER",
                            "APP_DOMAIN", "APP_HOST", "APP_VAR1", "APP_VAR2", "APP_VAR3", "APP_VAR4",
                            "ENV", "ENVGP",
                            "COUNTRY", "COUNTRYGP1",
                            "TEST",
                            "TESTCASE",
                            "SSIP", "SSPORT",
                            "TAG",
                            "EXECUTIONID",
                            "EXESTART",
                            "EXESTORAGEURL",
                            "STEP.n.RETURNCODE",
                            "TODAY-yyyy", "TODAY-MM", "TODAY-dd", "TODAY-doy", "TODAY-HH", "TODAY-mm", "TODAY-ss",
                            "YESTERDAY-yyyy", "YESTERDAY-MM", "YESTERDAY-dd", "YESTERDAY-doy", "YESTERDAY-HH", "YESTERDAY-mm", "YESTERDAY-ss"
                        ];
                        var availableTags = [
                            "property",
                            "object",
                            "system"
                        ];

                        Tags = [
                            {
                                array: availableObjectProperties,
                                regex: "%object\\.[^\\.]*\\.",
                                addBefore: "",
                                addAfter: "%",
                                isCreatable: false
                            },
                            {
                                array: availableObjects,
                                regex: "%object\\.",
                                addBefore: "",
                                addAfter: ".",
                                isCreatable: true
                            },
                            {
                                array: availableProperties,
                                regex: "%property\\.",
                                addBefore: "",
                                addAfter: "%",
                                isCreatable: true
                            },
                            {
                                array: availableSystemValues,
                                regex: "%system\\.",
                                addBefore: "",
                                addAfter: "%",
                                isCreatable: false
                            },
                            {
                                array: availableTags,
                                regex: "%",
                                addBefore: "",
                                addAfter: ".",
                                isCreatable: false
                            }
                        ];

                        autocompleteAllFields(Tags, data.info, test, testcase);

                    });

                    // Manage Authoritise.
                    $("#deleteTestCase").attr("disabled", !data.hasPermissionsDelete);
                    $("#addStep").attr("disabled", !data.hasPermissionsUpdate);
                    $("#deleteStep").attr("disabled", !data.hasPermissionsUpdate);
                    $("#saveScript").attr("disabled", !data.hasPermissionsUpdate);
                    $("#addActionBottom").attr("disabled", !data.hasPermissionsUpdate);
                    $("#addProperty").attr("disabled", !data.hasPermissionsUpdate);
                    $("#saveProperty1").attr("disabled", !data.hasPermissionsUpdate);
                    $("#saveProperty2").attr("disabled", !data.hasPermissionsUpdate);

                    // Building full list of country from testcase.
                    var myCountry = [];
                    $.each(testcaseinfo.countryList, function (index) {
                        myCountry.push(index);
                    });

                    $("#manageProp").click(function () {
                        editPropertiesModalClick(test, testcase, testcaseinfo, undefined, undefined, data.hasPermissionsUpdate);
                    });

                    // Button Add Property insert a new Property
                    $("#addProperty").click(function () {
                        var newProperty = {
                            property: "",
                            description: "",
                            country: myCountry,
                            type: "text",
                            database: "",
                            value1: "",
                            value2: "",
                            length: 0,
                            rowLimit: 0,
                            nature: "STATIC",
                            toDelete: false
                        };

                        drawProperty(newProperty, testcaseinfo, true);
                        autocompleteAllFields();
                    });

                    $('[data-toggle="tooltip"]').tooltip();

                    initModification();

                },
                error: showUnexpectedError
            });



            $("#propertiesModal [name='buttonSave']").click(editPropertiesModalSaveHandler);

            $("#addStep").click({stepList: stepList}, addStep);
            $('#addStepModal').on('hidden.bs.modal', function () {
                $("#importInfo").removeData("stepInfo");
                $("#importInfo").empty();
                $("#addStepModal #description").val("");
                $("#useStep").prop("checked", false);
                $("#importDetail").hide();
            });

            $("#deleteStep").click(function () {

                var step = $("#stepList .active").data("item");

                if (step.isStepInUseByOtherTestCase) {
                    showStepUsesLibraryInConfirmationModal(step);
                } else {
                    setModif(true);
                    step.setDelete();
                }
            });

            $("#addAction").click(function () {
                addActionAndFocus()
            });
            $("#saveScript").click(saveScript);
            $("#saveScriptAs").click(function () {
                duplicateTestCaseClick(test, testcase);
                $('#editTestCaseModal').on("hidden.bs.modal", function (e) {
                    $('#editTestCaseModal').unbind("hidden.bs.modal");
                    var t = $('#editTestCaseModal').find("#test option:selected");
                    var tc = $('#editTestCaseModal').find("#testCase");
                    if ($('#editTestCaseModal').data("Saved")) {
                        $('#editTestCaseModal').data("Saved", undefined);
                        window.location = "./TestCaseScript.jsp?test=" + t.val() + "&testcase=" + tc.val();
                    }
                });
            });

            $("#runTestCase").parent().attr("href", "./RunTests1.jsp?test=" + test + "&testcase=" + testcase);
            $("#seeLastExec").parent().attr("href", "./ExecutionDetailList.jsp?test=" + test + "&testcase=" + testcase);
            $("#seeLogs").parent().attr("href", "./LogViewer.jsp?Test=" + test + "&TestCase=" + testcase);

            $.ajax({
                url: "ReadTestCaseExecution",
                data: {test: test, testCase: testcase},
                dataType: "json",
                success: function (data) {
                    if (!jQuery.isEmptyObject(data.contentTable)) {
                        $("#rerunTestCase").parent().attr("href", "./RunTests1.jsp?test=" + test + "&testcase=" + testcase + "&country=" + data.contentTable.country + "&environment=" + data.contentTable.env);
                        $("#rerunTestCase").attr("title", "Last Execution was " + data.contentTable.controlStatus + " in " + data.contentTable.env + " in " + data.contentTable.country + " on " + data.contentTable.end)
                    } else {
                        $("#rerunTestCase").attr("disabled", true);
                        $("#seeLastExec").attr("disabled", true);
                    }
                },
                error: showUnexpectedError
            });
            var height = $("nav.navbar.navbar-inverse.navbar-static-top").outerHeight(true) + $("div.alert.alert-warning").outerHeight(true) + $(".page-title-line").outerHeight(true) - 10;

            $("#testCaseTitle").affix({offset: {top: height}});
            $("#list-wrapper").affix({offset: {top: height}});

            var wrap = $(window);

            wrap.on("scroll", function (e) {
                if ($("#testCaseTitle").width() != $("#testCaseTitle").parent().width() - 30) {
                    $("#testCaseTitle").width($("#testCaseTitle").parent().width() - 30);
                    $("#list-wrapper").width($("#nav-execution").width());
                }
            });

            wrap.resize(function (e) {
                if ($("#testCaseTitle").width() != $("#testCaseTitle").parent().width() - 30) {
                    $("#testCaseTitle").width($("#testCaseTitle").parent().width() - 30);
                    $("#list-wrapper").width($("#nav-execution").width());
                }
                $('.action [data-toggle="tooltip"], .control [data-toggle="tooltip"]').tooltip('show');
            })
        }
    });
});

function displayPageLabel(doc) {
    $("h1.page-title-line").html(doc.getDocLabel("page_testcasescript", "testcasescript_title"));
    $("#nav-execution #list-wrapper #stepListWrapper h3").html(doc.getDocLabel("page_testcasescript", "steps_title"));
    $("#nav-execution #list-wrapper #tcButton h3").html(doc.getDocLabel("page_global", "columnAction"));
    $("#nav-execution #list-wrapper #deleteButton h3").html(doc.getDocLabel("page_global", "columnAction") + " " + doc.getDocLabel("page_header", "menuTestCase"));
    $("#deleteTestCase").html(doc.getDocLabel("page_testcaselist", "btn_delete"));
    $("#saveScript").html("<span class='glyphicon glyphicon-save'></span> " + doc.getDocLabel("page_testcasescript", "save_script"));
    $("#editTcInfo").html(doc.getDocLabel("page_testcasescript", "edit_testcase"));
    $("#runTestCase").html("<span class='glyphicon glyphicon-play'></span> " + doc.getDocLabel("page_testcasescript", "run_testcase"));
    $("#rerunTestCase").html("<span class='glyphicon glyphicon-forward'></span> " + doc.getDocLabel("page_testcasescript", "rerun_testcase"));
    $("#seeLastExec").html("<span class='glyphicon glyphicon-fast-backward'></span> " + doc.getDocLabel("page_testcasescript", "see_lastexec"));
    $("#seeLogs").html("<span class='glyphicon glyphicon-book'></span> " + doc.getDocLabel("page_testcasescript", "see_logs"));
    $("#runOld").html("<span class='glyphicon glyphicon-bookmark'></span> " + doc.getDocLabel("page_testcasescript", "run_old"));
    $("#addStep").html(doc.getDocLabel("page_testcasescript", "add_step"));
    $("#manageProp").html(doc.getDocLabel("page_testcasescript", "manage_prop"));
    $("#addActionBottomBtn button").html(doc.getDocLabel("page_testcasescript", "add_action"));
    $("#stepConditionOper").prev().html(doc.getDocLabel("page_testcasescript", "step_condition_operation"));
    $("#stepConditionVal1").prev().html(doc.getDocLabel("page_testcasescript", "step_condition_value1"));
}

function addAction(action) {
    setModif(true);
    var step = $("#stepList li.active").data("item");
    var act = new Action(null, step, true);
    step.setAction(act, action);
    setAllSort();
    return act;
}

function addActionAndFocus(action) {
    $.when(addAction(action)).then(function (action) {
        listenEnterKeypressWhenFocusingOnDescription();
        $($(action.html[0]).find(".description")[0]).focus();
        autocompleteAllFields();
        setPlaceholderAction();
    });
}

function getTestCase(test, testcase, step) {
    window.location.href = "./TestCaseScript.jsp?test=" + test + "&testcase=" + testcase + "&step=" + step;
}

function setAllSort() {
    var stepList = $("#stepList li");
    var stepArr = [];

    // Construct the step/action/control list:
    // Iterate over steps
    for (var i = 0; i < stepList.length; i++) {
        var step = $(stepList[i]).data("item");
        var actionArr = [];

        if (!step.toDelete) {
            // Set the step's sort
            step.setSort(i + 1);

            // Get step's actions
            var actionList = step.stepActionContainer.children(".action-group").children(".action");

            // Iterate over actions
            for (var j = 0; j < actionList.length; j++) {
                var action = $(actionList[j]).data("item");
                var controlArr = [];

                if (!action.toDelete) {
                    // Set the action's sort
                    action.setSort(j + 1);

                    // Get action's controls
                    var controlList = action.html.children(".control");

                    // Iterate over controls
                    for (var k = 0; k < controlList.length; k++) {
                        var control = $(controlList[k]).data("item");

                        if (!control.toDelete) {
                            // Set the control's sort
                            control.setSort(k + 1);

                            // Then push control into result array
                            controlArr.push(control.getJsonData());
                        }
                    }
                }
                var actionJson = action.getJsonData();
                actionJson.controlArr = controlArr;
                actionArr.push(actionJson);
            }
            var stepJson = step.getJsonData();
            stepJson.actionArr = actionArr;
            stepArr.push(stepJson);
        }
    }

    return stepArr;
}

function saveScript() {
    var stepArr = setAllSort();

    var properties = $("#masterProp");
    var propArr = [];
    for (var i = 0; i < properties.length; i++) {
        propArr.push($(properties[i]).data("property"));
    }

    $.ajax({
        url: "UpdateTestCaseWithDependencies1",
        async: true,
        method: "POST",
        data: {informationInitialTest: GetURLParameter("test"),
            informationInitialTestCase: GetURLParameter("testcase"),
            informationTest: GetURLParameter("test"),
            informationTestCase: GetURLParameter("testcase"),
            stepArray: JSON.stringify(stepArr),
            propArr: JSON.stringify(propArr)},
        success: function () {

            var stepHtml = $("#stepList li.active");
            var stepData = stepHtml.data("item");

            var parser = document.createElement('a');
            parser.href = window.location.href;

            var new_uri = parser.pathname + "?test=" + GetURLParameter("test") + "&testcase=" + GetURLParameter("testcase") + "&step=" + stepData.sort;

            setModif(false);

            window.location.href = new_uri;
        },
        error: showUnexpectedError
    });
}

function drawProperty(property, testcaseinfo, canUpdate) {
    var doc = new Doc();
    console.debug(canUpdate);
    var selectType = getSelectInvariant("PROPERTYTYPE", false, true);
    var selectDB = getSelectInvariant("PROPERTYDATABASE", false, true);
    var selectNature = getSelectInvariant("PROPERTYNATURE", false, true);
    var deleteBtn = $("<button class='col-lg-6 btn btn-danger btn-sm'></button>").append($("<span></span>").addClass("glyphicon glyphicon-trash"));
    var moreBtn = $("<button class='col-lg-6 btn btn-default btn-sm'></button>").append($("<span></span>").addClass("glyphicon glyphicon-chevron-down"));

    var propertyInput = $("<input onkeypress='return restrictCharacters(this, event, propertyNameRestriction);' id='propName' placeholder='" + doc.getDocLabel("page_testcasescript", "feed_propertyname") + "'>").addClass("form-control input-sm").val(property.property);
    var descriptionInput = $("<textarea rows='1' id='propDescription' placeholder='" + doc.getDocLabel("page_testcasescript", "feed_propertydescription") + "'>").addClass("form-control input-sm").val(property.description);
    var valueInput = $("<textarea rows='1' placeholder='" + doc.getDocLabel("page_applicationObject", "Value") + "'></textarea>").addClass("form-control input-sm").val(property.value1);
    var value2Input = $("<textarea rows='1' placeholder='" + doc.getDocLabel("page_applicationObject", "Value") + "'></textarea>").addClass("form-control input-sm").val(property.value2);
    var lengthInput = $("<input placeholder='" + doc.getDocLabel("page_testcasescript", "length") + "'>").addClass("form-control input-sm").val(property.length);
    var rowLimitInput = $("<input placeholder='" + doc.getDocLabel("page_testcasescript", "row_limit") + "'>").addClass("form-control input-sm").val(property.rowLimit);
    var table = $("#propTable");

    selectType.attr("disabled", !canUpdate);
    selectDB.attr("disabled", !canUpdate);
    selectNature.attr("disabled", !canUpdate);
    deleteBtn.attr("disabled", !canUpdate);
    propertyInput.prop("readonly", !canUpdate);
    descriptionInput.prop("readonly", !canUpdate);
    valueInput.prop("readonly", !canUpdate);
    value2Input.prop("readonly", !canUpdate);
    lengthInput.prop("readonly", !canUpdate);
    rowLimitInput.prop("readonly", !canUpdate);

    var content = $("<div class='row property list-group-item'></div>");
    var props = $("<div class='col-sm-11'></div>");
    var right = $("<div class='col-sm-1 propertyButtons'></div>");

    var row1 = $("<div class='row' id='masterProp' name='masterProp' style='margin-top:10px;'></div>");
    var row2 = $("<div class='row' style='display:none;'></div>");
    var row3 = $("<div class='row' style='display:none;'></div>");
    var row4 = $("<div class='row' name='masterProp'></div>");
    var row5 = $("<div class='row'></div>");
    var propertyName = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "property_field"))).append(propertyInput);
    var description = $("<div class='col-sm-6 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "description_field"))).append(descriptionInput);
    var country = $("<div class='col-sm-10 has-feedback'></div>").append(getTestCaseCountry(testcaseinfo.countryList, property.country, !canUpdate));
    var type = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "type_field"))).append(selectType.val(property.type));
    var db = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "db_field"))).append(selectDB.val(property.database));
    var value = $("<div class='col-sm-8 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value1_field"))).append(valueInput);
    var value2 = $("<div class='col-sm-6 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value2_field"))).append(value2Input);
    var length = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "length_field"))).append(lengthInput);
    var rowLimit = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "rowlimit_field"))).append(rowLimitInput);
    var nature = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "nature_field"))).append(selectNature.val(property.nature));


    var selectAllBtn = $("<button></button>").addClass("btn btn-default btn-sm").append($("<span></span>").addClass("glyphicon glyphicon-check")).click(function () {
        country.find("input[type='checkbox']").prop('checked', true).trigger("change");
    });
    selectAllBtn.attr("disabled", !canUpdate);
    var selectNoneBtn = $("<button></button>").addClass("btn btn-default btn-sm").append($("<span></span>").addClass("glyphicon glyphicon-unchecked")).click(function () {
        country.find("input[type='checkbox']").prop('checked', false).trigger("change");
    });
    selectNoneBtn.attr("disabled", !canUpdate);
    var btnRow = $("<div class='col-sm-2 has-feedback'></div>").css("margin-top", "5px").css("margin-bottom", "5px").append(selectAllBtn).append(selectNoneBtn);

    deleteBtn.click(function () {
        property.toDelete = (property.toDelete) ? false : true;

        if (property.toDelete) {
            content.addClass("list-group-item-danger");
        } else {
            content.removeClass("list-group-item-danger");
        }
    });

    moreBtn.click(function () {
        if ($(this).find("span").hasClass("glyphicon-chevron-down")) {
            $(this).find("span").removeClass("glyphicon-chevron-down");
            $(this).find("span").addClass("glyphicon-chevron-up");
        } else {
            $(this).find("span").removeClass("glyphicon-chevron-up");
            $(this).find("span").addClass("glyphicon-chevron-down");
        }
        $(this).parent().parent().find(".row:not([name='masterProp'])").toggle();
    });

    propertyInput.change(function () {
        property.property = $(this).val();
    });

    descriptionInput.change(function () {
        property.description = $(this).val();
    });

    selectType.change(function () {
        property.type = $(this).val();
    });

    selectDB.change(function () {
        property.database = $(this).val();
    });

    valueInput.change(function () {
        property.value1 = $(this).val();
    });

    value2Input.change(function () {
        property.value2 = $(this).val();
    });

    lengthInput.change(function () {
        property.length = $(this).val();
    });

    rowLimitInput.change(function () {
        property.rowLimit = $(this).val();
    });

    selectNature.change(function () {
        property.nature = $(this).val();
    });

    row1.data("property", property);
    row1.append(propertyName);
    row1.append(type);
    row1.append(value);
    props.append(row1);

    row4.append(btnRow);
    row4.append(country);
    props.append(row4);

    row2.append(description);
    row2.append(value2);
    props.append(row2);

    row3.append(db);
    row3.append(length);
    row3.append(rowLimit);
    row3.append(nature);
    props.append(row3);

    right.append(moreBtn).append(deleteBtn);

    content.append(props).append(right);
    table.append(content);
}

function drawInheritedProperty(propList) {
    var doc = new Doc();
    var propertyArray = [];

    var selectType = getSelectInvariant("PROPERTYTYPE", false, true).attr("disabled", true);
    var selectDB = getSelectInvariant("PROPERTYDATABASE", false, true).attr("disabled", true);
    var selectNature = getSelectInvariant("PROPERTYNATURE", false, true).attr("disabled", true);
    var table = $("#inheritedPropPanel");

    for (var index = 0; index < propList.length; index++) {
        var property = propList[index];
        propertyArray.push(propList[index].property);

        var test = property.fromTest;
        var testcase = property.fromTestCase;

        var moreBtn = $("<button class='col-sm-6 btn btn-default btn-sm'></button>").append($("<span></span>").addClass("glyphicon glyphicon-chevron-down"));
        var editBtn = $("<a href='./TestCaseScript.jsp?test=" + test + "&testcase=" + testcase + "&property=" + property.property + "' class='col-sm-6 btn btn-primary btn-sm'></a>").append($("<span></span>").addClass("glyphicon glyphicon-pencil"));

        var propertyInput = $("<input id='propName' placeholder='" + doc.getDocLabel("page_testcasescript", "feed_propertyname") + "' disabled>").addClass("form-control input-sm").val(property.property);
        var descriptionInput = $("<textarea rows='1' id='propDescription' placeholder='" + doc.getDocLabel("page_testcasescript", "feed_propertydescription") + "' disabled>").addClass("form-control input-sm").val(property.description);
        var valueInput = $("<textarea rows='1' placeholder='" + doc.getDocLabel("page_applicationObject", "Value") + "' disabled></textarea>").addClass("form-control input-sm").val(property.value1);
        var value2Input = $("<textarea rows='1' placeholder='" + doc.getDocLabel("page_applicationObject", "Value") + "' disabled></textarea>").addClass("form-control input-sm").val(property.value2);
        var lengthInput = $("<input placeholder='" + doc.getDocLabel("page_testcasescript", "length") + "' disabled>").addClass("form-control input-sm").val(property.length);
        var rowLimitInput = $("<input placeholder='" + doc.getDocLabel("page_testcasescript", "row_limit") + "' disabled>").addClass("form-control input-sm").val(property.rowLimit);

        var content = $("<div class='row property list-group-item disabled'></div>");
        var props = $("<div class='col-sm-11'></div>");
        var right = $("<div class='col-sm-1 propertyButtons'></div>");

        var row1 = $("<div class='row' id='masterProp' name='masterProp' style='margin-top:10px;'></div>");
        var row2 = $("<div class='row' style='display:none;'></div>");
        var row3 = $("<div class='row' style='display:none;'></div>");
        var row4 = $("<div class='row' name='masterProp'></div>");
        var row5 = $("<div class='row'></div>");
        var propertyName = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "property_field"))).append(propertyInput);
        var description = $("<div class='col-sm-6 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "description_field"))).append(descriptionInput);
        var country = $("<div class='col-sm-10 has-feedback'></div>").append(getTestCaseCountry(property.country, property.country, true));
        var type = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "type_field"))).append(selectType.clone().val(property.type));
        var db = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "db_field"))).append(selectDB.clone().val(property.database));
        var value = $("<div class='col-sm-8 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value1_field"))).append(valueInput);
        var value2 = $("<div class='col-sm-6 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value2_field"))).append(value2Input);
        var length = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "length_field"))).append(lengthInput);
        var rowLimit = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "rowlimit_field"))).append(rowLimitInput);
        var nature = $("<div class='col-sm-2 form-group has-feedback'></div>").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "nature_field"))).append(selectNature.clone().val(property.nature));


        var selectAllBtn = $("<button disabled></button>").addClass("btn btn-default btn-sm").append($("<span></span>").addClass("glyphicon glyphicon-check")).click(function () {
            country.find("input[type='checkbox']").prop('checked', true);
        });
        var selectNoneBtn = $("<button disabled></button>").addClass("btn btn-default btn-sm").append($("<span></span>").addClass("glyphicon glyphicon-unchecked")).click(function () {
            country.find("input[type='checkbox']").prop('checked', false);
        });
        var btnRow = $("<div class='col-sm-2 has-feedback'></div>").css("margin-top", "5px").css("margin-bottom", "5px").append(selectAllBtn).append(selectNoneBtn);

        moreBtn.click(function () {
            if ($(this).find("span").hasClass("glyphicon-chevron-down")) {
                $(this).find("span").removeClass("glyphicon-chevron-down");
                $(this).find("span").addClass("glyphicon-chevron-up");
            } else {
                $(this).find("span").removeClass("glyphicon-chevron-up");
                $(this).find("span").addClass("glyphicon-chevron-down");
            }
            $(this).parent().parent().find(".row:not([name='masterProp'])").toggle();
        });

        row1.data("property", property);
        row1.append(propertyName);
        row1.append(type);
        row1.append(value);
        props.append(row1);

        row4.append(btnRow);
        row4.append(country);
        props.append(row4);

        row2.append(description);
        row2.append(value2);
        props.append(row2);

        row3.append(db);
        row3.append(length);
        row3.append(rowLimit);
        row3.append(nature);
        props.append(row3);

        right.append(moreBtn);
        right.append(editBtn);

        content.append(props).append(right);
        table.append(content);
    }

    sortProperties("#inheritedPropPanel");
    return propertyArray;
}

function loadProperties(test, testcase, testcaseinfo, propertyToFocus, canUpdate) {

    return new Promise(function (resolve, reject) {
        var array = [];

        $.ajax({
            url: "GetPropertiesForTestCase",
            data: {test: test, testcase: testcase},
            async: true,
            success: function (data) {

                for (var index = 0; index < data.length; index++) {
                    var property = data[index];
                    array.push(data[index].property);
                    property.toDelete = false;
                    drawProperty(property, testcaseinfo, canUpdate);
                }


                sortProperties("#propTable");
                var scope = undefined;
                if (propertyToFocus != undefined && propertyToFocus != null) {
                    $("#propertiesModal #propTable #propName").each(function (i) {
                        if ($(this).val() == propertyToFocus) {
                            scope = this;
                            $("#propertiesModal").on("shown.bs.modal", function (e) {
                                $(scope).focus();
                                $(scope).click();
                            });
                            $("#propertiesModal").modal("show");
                        }
                    });
                }

                resolve(array);

            },
            error: showUnexpectedError
        });
    });
}

function sortProperties(identifier) {
    var container = $(identifier);
    var list = container.children(".property");
    list.sort(function (a, b) {

        var aProp = $(a).find("#masterProp").data("property").property.toLowerCase(),
                bProp = $(b).find("#masterProp").data("property").property.toLowerCase();

        if (aProp > bProp) {
            return 1;
        }
        if (aProp < bProp) {
            return -1;
        }
        return 0;
    });
    container.append(list);
}

function getTestCaseCountry(countryList, countryToCheck, isDisabled) {
    var html = [];
    var cpt = 0;
    var div = $("<div></div>").addClass("checkbox");

    $.each(countryList, function (index) {
        var country;

        if (typeof index === "number") {
            country = countryList[index];
        } else if (typeof index === "string") {
            country = index;
        }
        var input = $("<input>").attr("type", "checkbox").attr("name", country);

        if ((countryToCheck.indexOf(country) !== -1)) {
            input.prop("checked", true).trigger("change");
        }
        if (isDisabled) {
            input.prop("disabled", "disabled");
        } else {
            input.change(function () {
                var country = $(this).prop("name");
                var checked = $(this).prop("checked");
                var index = countryToCheck.indexOf(country);

                if (checked && index === -1) {
                    countryToCheck.push(country);
                } else if (!checked && index !== -1) {
                    countryToCheck.splice(index, 1);
                }
            });
        }

        div.append($("<label></label>").addClass("checkbox-inline")
                .append(input)
                .append(country));

        cpt++;
//        if (cpt % 10 === 0) {
//            div = $("<div></div>").addClass("checkbox");
//        }
        html.push(div);
    });

    return html;
}

function loadTestCaseInfo(info) {
    $(".testTestCase #description").text(info.shortDescription);
}

function changeLib() {
    setModif(true);
    var stepHtml = $("#stepList li.active");
    var stepData = stepHtml.data("item");
    if (stepData.inLibrary == "Y") {
        stepData.inLibrary = "N";
        $(this).removeClass("btn-dark");
    } else {
        stepData.inLibrary = "Y";
        $(this).addClass("btn-dark");
    }
}

function addStep(event) {
    var stepList = event.data.stepList;
    $("#addStepModal").modal('show');

    // Setting the focus on the Description of the step.
    $('#addStepModal').on('shown.bs.modal', function () {
        $('#description').focus();
    })

    $(".sub-sub-item").click(function () {
        var stepInfo = $(this).data("stepInfo");

        $("#importInfo").text("Imported from " + stepInfo.test + " - " + stepInfo.testCase + " - " + stepInfo.sort + ")").data("stepInfo", stepInfo);
        $("#addStepModal #description").val(stepInfo.description);
        $("#useStep").prop("checked", true);

        $("#importDetail").show();
    });

    $("#addStepConfirm").unbind("click").click(function (event) {
        setModif(true);
        var step = {"inLibrary": "N",
            "objType": "step",
            "useStepTest": "",
            "useStepTestCase": "",
            "useStep": "N",
            "description": "",
            "useStepStep": -1,
            "actionList": [],
            "conditionOper": "always",
            "conditionVal1": "",
            "conditionVal2": ""
        };

        step.description = $("#addStepModal #description").val();
        if ($("#importInfo").data("stepInfo")) {
            var useStep = $("#importInfo").data("stepInfo");
            $.ajax({
                url: "ReadTestCaseStep",
                data: {test: useStep.test, testcase: useStep.testCase, step: useStep.step},
                async: false,
                success: function (data) {
                    step.actionList = data.tcsActionList;

                    for (var index = 0; index < data.tcsActionControlList.length; index++) {
                        var control = data.tcsActionControlList[index];

                        step.actionList[control.sequence - 1].controlList.push(control);
                    }
                    sortStep(step);
                }
            });
            if ($("#useStep").prop("checked")) {
                step.useStep = "Y";
                step.useStepTest = useStep.test;
                step.useStepTestCase = useStep.testCase;
                step.useStepStep = useStep.step;
                step.useStepStepSort = useStep.sort;
            }
        }
        var stepObj = new Step(step, stepList, true);

        stepObj.draw();
        stepList.push(stepObj);
        stepObj.html.trigger("click");
    });
}

function createStepList(data, stepList, stepIndex, canUpdate) {
    for (var i = 0; i < data.length; i++) {
        var step = data[i];
        var stepObj = new Step(step, stepList, canUpdate);

        stepObj.draw();
        stepList.push(stepObj);
    }

    if (stepIndex != undefined) {
        var find = false;
        for (var i = 0; i < stepList.length; i++) {
            if (stepList[i].sort == stepIndex) {
                find = true;
                $(stepList[i].html[0]).click();
            }
        }
        if (!find) {
            $(stepList[0].html[0]).click();
        }
    } else if (stepList.length > 0) {
        $(stepList[0].html[0]).click();
    } else {
        $("#stepHeader").hide();
        $("#addActionBottomBtn").hide();
        $("#addAction").attr("disabled", true);
    }
}

/** Modification Status **/

var getModif, setModif, initModification;
(function () {
    var isModif = false;
    getModif = function () {
        return isModif;
    };
    setModif = function (val) {
        isModif = val;
        if (isModif == true && $("#saveScript").hasClass("btn-default")) {
            $("#saveScript").removeClass("btn-default").addClass("btn-primary");
        } else if (isModif == false && $("#saveScript").hasClass("btn-primary")) {
            $("#saveScript").removeClass("btn-primary").addClass("btn-default");
        }

    };
    initModification = function () {
        $(".panel-body input, .panel-body select").change(function () {
            setModif(true);
        })
    };
})();

/** LIBRARY STEP UTILY FUNCTIONS **/

function loadLibraryStep(search) {
    $("#lib").empty();
    showLoaderInModal("#addStepModal");
    $.ajax({
        url: "GetStepInLibrary",
        data: {system: getUser().defaultSystem},
        async: true,
        success: function (data) {
            var test = {};

            for (var index = 0; index < data.testCaseStepList.length; index++) {
                var step = data.testCaseStepList[index];

                if (search == undefined || search == "" || step.description.indexOf(search) > -1 || step.testCase.indexOf(search) > -1 || step.test.indexOf(search) > -1) {
                    if (!test.hasOwnProperty(step.test)) {
                        $("#lib").append($("<a></a>").addClass("list-group-item").attr("data-toggle", "collapse").attr("href", "[data-test='" + step.test + "']")
                                .text(step.test).prepend($("<span></span>").addClass("glyphicon glyphicon-chevron-right")));

                        var listGr = $("<div></div>").addClass("list-group collapse").attr("data-test", step.test);
                        $("#lib").append(listGr);

                        test[step.test] = {content: listGr, testCase: {}};
                    }
                    if ((!test[step.test].testCase.hasOwnProperty(step.testCase))) {
                        var listGrp = test[step.test].content;
                        listGrp.append($("<a></a>").addClass("list-group-item sub-item").attr("data-toggle", "collapse").attr("href", "[data-test='" + step.test + "'][data-testCase='" + step.testCase + "']")
                                .text(step.testCase + " - " + step.tcdesc).prepend($("<span></span>").addClass("glyphicon glyphicon-chevron-right")));

                        var listCaseGr = $("<div></div>").addClass("list-group collapse").attr("data-test", step.test).attr("data-testCase", step.testCase);
                        listGrp.append(listCaseGr);

                        test[step.test].testCase[step.testCase] = {content: listCaseGr, step: {}};
                    }
                    var listCaseGrp = test[step.test].testCase[step.testCase].content;
                    var listStepGrp = $("<a></a>").addClass("list-group-item sub-sub-item").attr("href", "#").text(step.description).data("stepInfo", step);
                    listCaseGrp.append(listStepGrp);
                    test[step.test].testCase[step.testCase].step[step.description] = listStepGrp;
                }
            }

            if (search != undefined && search != "") {
                $('#lib').find("div").toggleClass('in');
            }

            $('.list-group-item').unbind("click").on('click', function () {
                $('.glyphicon', this)
                        .toggleClass('glyphicon-chevron-right')
                        .toggleClass('glyphicon-chevron-down');
            });

            $("#addStepModal #search").unbind("input").on("input", function (e) {
                var search = $(this).val();
                // Clear any previously set timer before setting a fresh one
                window.clearTimeout($(this).data("timeout"));
                $(this).data("timeout", setTimeout(function () {
                    loadLibraryStep(search);
                }, 500));
            });

            hideLoaderInModal("#addStepModal");
        }
    });
}

function loadApplicationObject(dataInit) {
    return new Promise(function (resolve, reject) {
        var array = [];
        $.ajax({
            url: "ReadApplicationObject?application=" + dataInit.info.application,
            dataType: "json",
            success: function (data) {
                for (var i = 0; i < data.contentTable.length; i++) {
                    array.push(data.contentTable[i].object);
                }
                resolve(array);
            }
        });
    });
}

function showStepUsesLibraryInConfirmationModal(object) {
    var doc = new Doc();
    $("#confirmationModal [name='buttonConfirm']").text("OK");
    $("#confirmationModal [name='buttonDismiss']").hide();
    $("#confirmationModal").on("hidden.bs.modal", function () {
        $("#confirmationModal [name='buttonConfirm']").text(doc.getDocLabel("page_global", "buttonConfirm"));
        $("#confirmationModal [name='buttonDismiss']").show();
        $("#confirmationModal").unbind("hidden.bs.modal");
    });

    $.ajax({
        url: "ReadTestCaseStep",
        dataType: "json",
        data: {
            test: object.test,
            testcase: object.testcase,
            step: object.step,
            getUses: true
        },
        success: function (data) {
            var content = "";
            for (var i = 0; i < data.step.length; i++) {
                content += "<a target='_blank' href='./TestCaseScript.jsp?test=" + data.step[i].test + "&testcase=" + data.step[i].testCase + "&step=" + data.step[i].sort + "'>" + data.step[i].test + " - " + data.step[i].testCase + " - " + data.step[i].sort + " - " + data.step[i].description + "</a><br/>"
            }
            $("#confirmationModal #otherStepThatUseIt").empty().append(content);
        }
    });
    showModalConfirmation(function () {
        $('#confirmationModal').modal('hide');
    }, doc.getDocLabel("page_global", "warning"),
            doc.getDocLabel("page_testcasescript", "cant_detach_library") +
            "<br/>" +
            "<div id='otherStepThatUseIt' style='width:100%;'>" +
            "<div style='width:30px; margin-left: auto; margin-right: auto;'>" +
            "<span class='glyphicon glyphicon-refresh spin'></span>" +
            "</div>" +
            "</div>", "", "", "", "");
}


/** DRAG AND DROP HANDLERS **/

var source;

function isBefore(a, b) {
    if (a !== b && a.parentNode === b.parentNode) {
        for (var cur = a; cur; cur = cur.nextSibling) {
            if (cur === b) {
                return true;
            }
        }
    }
    return false;
}

function handleDragStart(event) {
    var dataTransfer = event.originalEvent.dataTransfer;
    var obj = this.parentNode;
    var offsetX = 50;
    var offsetY = 50;
    var img;

    if ($(obj).data("item") instanceof Action) {
        img = obj.parentNode;
    } else if ($(obj).data("item") instanceof Control) {
        img = obj;
    } else {
        img = obj;
        offsetX = 15;
        offsetY = 15;
    }

    source = obj;
    obj.style.opacity = '0.4';
    dataTransfer.effectAllowed = 'move';
    dataTransfer.setData('text/html', img.innerHTML);
    dataTransfer.setDragImage(img, offsetX, offsetY);
}

function handleDragEnter(event) {
    setModif(true);
    var target = this.parentNode;
    var sourceData = $(source).data("item");
    var targetData = $(target).data("item");

    if (sourceData instanceof Action && targetData instanceof Action) {
        if (isBefore(source.parentNode, target.parentNode)) {
            $(target).parent(".action-group").after(source.parentNode);
        } else {
            $(target).parent(".action-group").before(source.parentNode);
        }
    } else if (sourceData instanceof Control &&
            (targetData instanceof Action || targetData instanceof Control)) {
        if (isBefore(source, target) || targetData instanceof Action) {
            $(target).after(source);
        } else {
            $(target).before(source);
        }
    } else if (sourceData instanceof Step && targetData instanceof Step) {
        if (isBefore(source, target)) {
            $(target).after(source);
        } else {
            $(target).before(source);
        }
    }
}

function handleDragOver(event) {

    var e = event.originalEvent;

    if (e.preventDefault) {
        e.preventDefault(); // Necessary. Allows us to drop.
    }
    e.dataTransfer.dropEffect = 'move';

    return false;
}

function handleDragLeave(event) {

}

function handleDrop(event) {
    var e = event.originalEvent;

    if (e.stopPropagation) {
        e.stopPropagation(); // stops the browser from redirecting.
    }

    return false;
}

function handleDragEnd(event) {
    this.parentNode.style.opacity = '1';
    setAllSort();
}

/** DATA AGREGATION **/

function sortStep(step) {
    for (var j = 0; j < step.actionList.length; j++) {
        var action = step.actionList[j];

        action.controlList.sort(function (a, b) {
            return a.sort - b.sort;
        });
    }

    step.actionList.sort(function (a, b) {
        return a.sort - b.sort;
    });
}

function sortData(agreg) {
    for (var i = 0; i < agreg.length; i++) {
        var step = agreg[i];

        sortStep(step);
    }

    agreg.sort(function (a, b) {
        return a.sort - b.sort;
    });
}

/** JAVASCRIPT OBJECT **/

function Step(json, stepList, canUpdate) {
    this.stepActionContainer = $("<div></div>").addClass("step-container").css("display", "none");

    this.test = json.test;
    this.testcase = json.testCase;
    this.step = json.step;
    this.sort = json.sort;
    this.description = json.description;
    this.useStep = json.useStep;
    this.useStepTest = json.useStepTest;
    this.useStepTestCase = json.useStepTestCase;
    this.useStepStep = json.useStepStep;
    this.useStepStepSort = json.useStepStepSort;
    this.conditionOper = json.conditionOper;
    this.conditionVal1 = json.conditionVal1;
    this.conditionVal2 = json.conditionVal2;
    this.inLibrary = json.inLibrary;
    this.isStepInUseByOtherTestCase = json.isStepInUseByOtherTestCase;
    this.actionList = [];
    this.setActionList(json.actionList, canUpdate);

    this.stepList = stepList;
    this.toDelete = false;
    this.hasPermissionsUpdate = canUpdate;

    this.html = $("<li></li>").addClass("list-group-item list-group-item-calm row").css("margin-left", "0px");
    this.textArea = $("<div></div>").addClass("col-sm-10").addClass("step-description").text(this.description);

}

Step.prototype.draw = function () {
    var scope = this;
    var htmlElement = this.html;
    var badge = $("<div id='labelDiv' class='col-sm-1 badge'>").css("float", "right").css("margin-top", "-2px");
    var drag = $("<div></div>").addClass("col-sm-1 drag-step").css("padding-left", "5px").css("padding-right", "5px").prop("draggable", true)
            .append($("<span></span>").addClass("fa fa-ellipsis-v"));

    drag.on("dragstart", handleDragStart);
    drag.on("dragenter", handleDragEnter);
    drag.on("dragover", handleDragOver);
    drag.on("dragleave", handleDragLeave);
    drag.on("drop", handleDrop);
    drag.on("dragend", handleDragEnd);

    htmlElement.append(badge);
    htmlElement.append(drag);
    htmlElement.append(this.textArea);
    htmlElement.data("item", this);

    htmlElement.click(this.show);

    $("#stepPlus").unbind("click").click(function () {
        $("#stepHiddenRow").toggle();
        if ($(this).find("span").hasClass("glyphicon-chevron-down")) {
            $(this).find("span").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
        } else {
            $(this).find("span").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
        }
    });

    $("#stepList").append(htmlElement);
    $("#actionContainer").append(this.stepActionContainer);

    this.refreshSort();
};

Step.prototype.show = function () {
    var scope = this;
    var doc = new Doc();
    var object = $(this).data("item");

    $("#stepHeader").show();
    $("#addActionBottomBtn").show();

    for (var i = 0; i < object.stepList.length; i++) {
        var step = object.stepList[i];

        step.stepActionContainer.hide();
        step.stepActionContainer.find("[data-toggle='tooltip']").tooltip("hide");
        step.html.removeClass("active");
    }

    $(this).addClass("active");

    if (object.toDelete) {
        $("#deleteStep span").removeClass();
        $("#deleteStep span").addClass("glyphicon glyphicon-remove");
    } else {
        $("#deleteStep span").removeClass();
        $("#deleteStep span").addClass("glyphicon glyphicon-trash");
    }

    $("#isLib").unbind("click");
    if (object.inLibrary === "Y") {
        $("#isLib").addClass("btn-dark");
        if (object.isStepInUseByOtherTestCase) {
            $("#isLib").click(function () {

                showStepUsesLibraryInConfirmationModal(object);

            });
        } else {
            $("#isLib").click(changeLib);
        }
    } else {
        $("#isLib").removeClass("btn-dark");
        $("#isLib").click(changeLib);
    }

    if (object.useStep === "Y") {
        $("#isLib").hide();
        $("#UseStepRow").html("(" + doc.getDocLabel("page_testcasescript", "imported_from") + " <a href='./TestCaseScript.jsp?test=" + object.useStepTest + "&testcase=" + object.useStepTestCase + "&step=" + object.useStepStepSort + "' >" + object.useStepTest + " - " + object.useStepTestCase + " - " + object.useStepStepSort + "</a>)").show();
        $("#UseStepRowButton").html("|").show();
        $("#addAction").prop("disabled", true);
        $("#addActionBottomBtn").hide();
        $("#isUseStep").show();
    } else {
        $("#isLib").show();
        $("#UseStepRow").html("").hide();
        $("#UseStepRowButton").html("").hide();
        $("#addAction").prop("disabled", false);
        $("#addActionBottomBtn").show();
        $("#isUseStep").hide();
    }

    if (object.toDelete) {
        $("#contentWrapper").addClass("list-group-item-danger");
    } else {
        $("#contentWrapper").removeClass("list-group-item-danger");
    }

    var conditionVal1 = $("#stepConditionVal1");
    conditionVal1.css("width", "100%");
    conditionVal1.on("change", function () {
        object.conditionVal1 = conditionVal1.val();
    });
    conditionVal1.val(object.conditionVal1);

    var conditionVal2 = $("#stepConditionVal2");
    conditionVal2.css("width", "100%");
    conditionVal2.on("change", function () {
        object.conditionVal2 = conditionVal2.val();
    });
    conditionVal2.val(object.conditionVal2);

    var conditiononper = $("#stepConditionOper");
    conditiononper.replaceWith(getSelectInvariant("STEPCONDITIONOPER", false, true).css("width", "100%").addClass("form-control input-sm").attr("id", "stepConditionOper"));
    conditiononper = $("#stepConditionOper");
    conditiononper.on("change", function () {
        object.conditionOper = conditiononper.val();
        if ((object.conditionOper === "always") || (object.conditionOper === "never")) {
            conditionVal1.parent().hide();
            conditionVal2.parent().hide();
        } else {
            conditionVal1.parent().show();
            conditionVal2.parent().show();
        }
    });
    conditiononper.val(object.conditionOper).trigger("change");

    object.stepActionContainer.show();
    $("#stepDescription").unbind("change").change(function () {
        setModif(true);
        object.description = $(this).val();
    });

    $("#isUseStep").unbind("click").click(function () {
        setModif(true);
        if (object.useStep === "Y") {
            showModalConfirmation(function () {
                object.useStep = "N";
                object.useStepStep = -1;
                object.useStepTest = ";";
                object.useStepTestCase = "";
                saveScript();
            }, doc.getDocLabel("page_testcasescript", "unlink_useStep"), doc.getDocLabel("page_testcasescript", "unlink_useStep_warning"), "", "", "", "");
        }
    });

    $("#stepDescription").val(object.description);
    $("#stepInfo").show();
    $("#addActionContainer").show();
    $("#stepHeader").show()

    // Disable fields if Permission not allowing.
    $("#stepDescription").attr("disabled", !object.hasPermissionsUpdate);
    $("#isUseStep").attr("disabled", !object.hasPermissionsUpdate);
    $("#stepConditionOper").attr("disabled", !object.hasPermissionsUpdate);
    $("#stepConditionVal1").attr("disabled", !object.hasPermissionsUpdate);
    $("#stepConditionVal2").attr("disabled", !object.hasPermissionsUpdate);
    $("#isLib").attr("disabled", !object.hasPermissionsUpdate);

    object.stepActionContainer.find("div.fieldRow div:nth-child(n+2) input").trigger("input");

};

Step.prototype.setActionList = function (actionList, canUpdate) {
    for (var i = 0; i < actionList.length; i++) {
        this.setAction(actionList[i], undefined, canUpdate);
    }
};

Step.prototype.setAction = function (action, afterAction, canUpdate) {
    if (action instanceof Action) {
        action.draw(afterAction);
        this.actionList.push(action);
    } else {
        var actionObj = new Action(action, this, canUpdate);

        actionObj.draw(afterAction);
        this.actionList.push(actionObj);
    }
};

Step.prototype.setDescription = function (description) {
    this.description = description;
    this.textArea.text(description);
    $("#stepDescription").val(description);
};

Step.prototype.setDelete = function () {
    this.toDelete = (this.toDelete) ? false : true;

    if ($("#contentWrapper").hasClass("list-group-item-danger")) {
        $("#contentWrapper").removeClass("list-group-item-danger");
    } else {
        $("#contentWrapper").removeClass("well").addClass("list-group-item-danger well")
    }

    if (this.toDelete) {
        $("#deleteStep span").removeClass();
        $("#deleteStep span").addClass("glyphicon glyphicon-remove");
    } else {
        $("#deleteStep span").removeClass();
        $("#deleteStep span").addClass("glyphicon glyphicon-trash");
    }

    for (var i = 0; i < this.stepList.length; i++) {
        var step = this.stepList[i];

        if (step.toDelete) {
            step.html.addClass("list-group-item-danger");
            step.html.removeClass("list-group-item-calm");
        } else {
            step.html.addClass("list-group-item-calm");
            step.html.removeClass("list-group-item-danger");
        }
    }
};

Step.prototype.setStep = function (step) {
    this.step = step;
};

Step.prototype.getStep = function () {
    return this.step;
};

Step.prototype.setSort = function (sort) {
    this.sort = sort;
    this.refreshSort();
};

Step.prototype.refreshSort = function () {
    this.html.find("#labelDiv").empty().text(this.sort);
};

Step.prototype.getJsonData = function () {
    var json = {};

    json.toDelete = this.toDelete;
    json.test = this.test;
    json.testcase = this.testcase;
    json.step = this.step;
    json.sort = this.sort;
    json.description = this.description;
    json.useStep = this.useStep;
    json.useStepTest = this.useStepTest;
    json.useStepTestCase = this.useStepTestCase;
    json.useStepStep = this.useStepStep;
    json.inLibrary = this.inLibrary;
    json.conditionOper = this.conditionOper;
    json.conditionVal1 = this.conditionVal1;
    json.conditionVal2 = this.conditionVal2;

    return json;
};

function Action(json, parentStep, canUpdate) {
    this.html = $("<div></div>").addClass("action-group");
    this.parentStep = parentStep;

    if (json !== null) {
        this.test = json.test;
        this.testcase = json.testCase;
        this.step = json.step;
        this.sequence = json.sequence;
        this.sort = json.sort;
        this.description = json.description;
        this.action = json.action;
        this.object = json.object;
        this.property = json.property;
        this.forceExeStatus = json.forceExeStatus;
        this.conditionOper = json.conditionOper;
        this.conditionVal1 = json.conditionVal1;
        this.conditionVal2 = json.conditionVal2;
        this.screenshotFileName = json.screenshotFileName;
        this.value1 = json.value1;
        this.value2 = json.value2;
        this.controlList = [];
        this.setControlList(json.controlList, canUpdate);
    } else {
        this.test = "";
        this.testcase = "";
        this.step = parentStep.step;
        this.description = "";
        this.action = "Unknown";
        this.object = "";
        this.property = "";
        this.forceExeStatus = "";
        this.conditionOper = "always";
        this.conditionVal1 = "";
        this.conditionVal2 = "";
        this.screenshotFileName = "";
        this.value1 = "";
        this.value2 = "";
        this.controlList = [];
    }

    this.toDelete = false;
    this.hasPermissionsUpdate = canUpdate;
}

Action.prototype.draw = function (afterAction) {
    var htmlElement = this.html;
    var action = this;
    var row = $("<div></div>").addClass("step-action row").addClass("action");
    var drag = $("<div></div>").addClass("drag-step-action col-lg-1").prop("draggable", true).append($("<div>").attr("id", "labelDiv"));
    var plusBtn = $("<button></button>").addClass("btn btn-default add-btn").append($("<span></span>").addClass("glyphicon glyphicon-chevron-down"));
    var addBtn = $("<button></button>").addClass("btn btn-success add-btn").append($("<span></span>").addClass("glyphicon glyphicon-plus"));
    var addABtn = $("<button></button>").addClass("btn btn-primary add-btn").append($("<span></span>").addClass("glyphicon glyphicon-plus"));
    var supprBtn = $("<button></button>").addClass("btn btn-danger add-btn").append($("<span></span>").addClass("glyphicon glyphicon-trash"));
    var btnGrp = $("<div></div>").addClass("col-lg-1").css("padding", "0px").append($("<div>").addClass("boutonGroup").append(addABtn).append(supprBtn).append(addBtn).append(plusBtn));
    var imgGrp = $("<div></div>").addClass("col-lg-1").css("height", "100%").append($("<div style='margin-top:40px;'></div>").append($("<img>").attr("id", "ApplicationObjectImg").css("width", "100%")));

    if ((this.parentStep.useStep === "N") && (action.hasPermissionsUpdate)) {
        drag.append($("<span></span>").addClass("fa fa-ellipsis-v"));
        drag.on("dragstart", handleDragStart);
        drag.on("dragenter", handleDragEnter);
        drag.on("dragover", handleDragOver);
        drag.on("dragleave", handleDragLeave);
        drag.on("drop", handleDrop);
        drag.on("dragend", handleDragEnd);
    } else {
        addBtn.prop("disabled", true);
        addABtn.prop("disabled", true);
        supprBtn.prop("disabled", true);
    }

    plusBtn.click(function () {
        var container = $(this).parent().parent().parent();
        container.find(".fieldRow:eq(2)").toggle();
        if ($(this).find("span").hasClass("glyphicon-chevron-down")) {
            $(this).find("span").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
        } else {
            $(this).find("span").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
        }
    });

    var scope = this;

    addBtn.click(function () {
        addControlAndFocus(scope);
    });
    addABtn.click(function () {
        addActionAndFocus(scope);
    });

    supprBtn.click(function () {
        setModif(true);
        action.toDelete = (action.toDelete) ? false : true;

        if (action.toDelete) {
            action.html.find(".step-action").addClass("danger");
        } else {
            action.html.find(".step-action").removeClass("danger");
        }
    });

    row.append(drag);
    row.append(this.generateContent());
    row.append(imgGrp);
    row.append(btnGrp);
    row.data("item", this);
    htmlElement.prepend(row);

    if (afterAction == undefined) {
        this.parentStep.stepActionContainer.append(htmlElement);
    } else {
        afterAction.html.after(htmlElement);
    }
    this.refreshSort();
};

Action.prototype.setControlList = function (controlList, canUpdate) {
    for (var i = 0; i < controlList.length; i++) {
        this.setControl(controlList[i], undefined, canUpdate);
    }
};

Action.prototype.setControl = function (control, afterControl, canUpdate) {
    if (control instanceof Control) {
        control.draw(afterControl);
        this.controlList.push(control);
    } else {
        var controlObj = new Control(control, this, canUpdate);

        controlObj.draw(afterControl);
        this.controlList.push(controlObj);
    }
};

Action.prototype.setStep = function (step) {
    this.step = step;
};

Action.prototype.setSequence = function (sequence) {
    this.sequence = sequence;
};

Action.prototype.getSequence = function () {
    return this.sequence;
};

Action.prototype.setSort = function (sort) {
    this.sort = sort;
    this.refreshSort();
};

Action.prototype.refreshSort = function () {
    this.html.find(".action #labelDiv").empty().append($("<span>").text(this.sort).addClass("label label-primary"));
};

Action.prototype.generateContent = function () {
    var obj = this;
    var doc = new Doc();
    var content = $("<div></div>").addClass("content col-lg-9");
    var firstRow = $("<div style='margin-top:15px;'></div>").addClass("fieldRow row form-group has-feedback");
    var secondRow = $("<div></div>").addClass("fieldRow row");
    var thirdRow = $("<div></div>").addClass("fieldRow row").hide();

    var actionList = $("<select></select>").addClass("form-control input-sm");
    var descField = $("<input>").addClass("description").addClass("form-control").prop("placeholder", doc.getDocLabel("page_testcasescript", "describe_action"));
    var objectField = $("<input>").attr("data-toggle", "tooltip").attr("data-animation", "false").attr("data-html", "true").attr("data-container", "body").attr("data-placement", "top").attr("data-trigger", "manual").attr("type", "text").addClass("form-control input-sm");
    var propertyField = $("<input>").attr("data-toggle", "tooltip").attr("data-animation", "false").attr("data-html", "true").attr("data-container", "body").attr("data-placement", "top").attr("data-trigger", "manual").attr("type", "text").addClass("form-control input-sm");

    var actionconditionval1 = $("<input>").attr("type", "text").addClass("form-control input-sm");
    var actionconditionval2 = $("<input>").attr("type", "text").addClass("form-control input-sm");
    var actionconditionoper = $("<select></select>").addClass("form-control input-sm");
    var forceExeStatusList = $("<select></select>").addClass("form-control input-sm");

    descField.val(this.description);
    descField.css("width", "100%");
    descField.on("change", function () {
        obj.description = descField.val();
    });

    actionconditionval1.css("width", "100%");
    actionconditionval1.on("change", function () {
        obj.conditionVal1 = actionconditionval1.val();
    });
    actionconditionval1.val(this.conditionVal1);

    actionconditionval2.css("width", "100%");
    actionconditionval2.on("change", function () {
        obj.conditionVal2 = actionconditionval2.val();
    });
    actionconditionval2.val(this.conditionVal2);

    actionList = getSelectInvariant("ACTION", false, true).css("width", "100%").attr("id", "actionSelect");
    actionList.val(this.action);
    actionList.on("change", function () {
        obj.action = actionList.val();
        setPlaceholderAction();
    });

    forceExeStatusList = getSelectInvariant("ACTIONFORCEEXESTATUS", false, true).css("width", "100%");
    forceExeStatusList.val(this.forceExeStatus);
    forceExeStatusList.on("change", function () {
        obj.forceExeStatus = forceExeStatusList.val();
//        setPlaceholderAction();
    });

    actionconditionoper = getSelectInvariant("ACTIONCONDITIONOPER", false, true).css("width", "100%");
    actionconditionoper.on("change", function () {
        obj.conditionOper = actionconditionoper.val();
        if ((obj.conditionOper === "always") || (obj.conditionOper === "never")) {
            actionconditionval1.parent().hide();
            actionconditionval2.parent().hide();
        } else {
            actionconditionval1.parent().show();
            actionconditionval2.parent().show();
        }
//        setPlaceholderAction();
    });
    actionconditionoper.val(this.conditionOper).trigger("change");

    objectField.val(this.value1);
    objectField.css("width", "100%");
    objectField.on("change", function () {
        obj.value1 = objectField.val();
    });

    propertyField.val(this.value2);
    propertyField.css("width", "100%");
    propertyField.on("change", function () {
        obj.value2 = propertyField.val();
    });

    firstRow.append(descField);
    secondRow.append($("<div></div>").addClass("col-lg-3 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "action_field"))).append(actionList));
    secondRow.append($("<div></div>").addClass("col-lg-5 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value1_field"))).append(objectField));
    secondRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value2_field"))).append(propertyField));
    thirdRow.append($("<div></div>").addClass("col-lg-3 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "condition_operation_field"))).append(actionconditionoper));
    thirdRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "condition_parameter_field"))).append(actionconditionval1));
    thirdRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "condition_parameter_field"))).append(actionconditionval2));
    thirdRow.append($("<div></div>").addClass("col-lg-3 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "force_execution_field"))).append(forceExeStatusList));

    actionconditionoper.trigger("change");

    if ((this.parentStep.useStep === "Y") || (!obj.hasPermissionsUpdate)) {
        descField.prop("readonly", true);
        objectField.prop("readonly", true);
        propertyField.prop("readonly", true);
        actionList.prop("disabled", "disabled");
        forceExeStatusList.prop("disabled", "disabled");
        actionconditionoper.prop("disabled", "disabled");
        actionconditionval1.prop("readonly", true);
        actionconditionval2.prop("readonly", true);
    }

    content.append(firstRow);
    content.append(secondRow);
    content.append(thirdRow);

    return content;
};

Action.prototype.getJsonData = function () {

    var json = {};

    json.toDelete = this.toDelete;
    json.test = this.test;
    json.testcase = this.testcase;
    json.step = this.step;
    json.sequence = this.sequence;
    json.sort = this.sort;
    json.description = this.description;
    json.action = this.action;
    json.object = this.value1;
    json.property = this.value2;
    json.forceExeStatus = this.forceExeStatus;
    json.conditionOper = this.conditionOper;
    json.conditionVal1 = this.conditionVal1;
    json.conditionVal2 = this.conditionVal2;
    json.screenshotFileName = "";

    return json;
};

function Control(json, parentAction, canUpdate) {
    if (json !== null) {
        this.test = json.test;
        this.testcase = json.testCase;
        this.step = json.step;
        this.sequence = json.sequence;
        this.control = json.control;
        this.sort = json.sort;
        this.description = json.description;
        this.objType = json.objType;
        this.controlSequence = json.controlSequence;
        this.value1 = json.value1;
        this.value2 = json.value2;
        this.fatal = json.fatal;
        this.conditionOper = json.conditionOper;
        this.conditionVal1 = json.conditionVal1;
        this.conditionVal2 = json.conditionVal2;
        this.screenshotFileName = "";
    } else {
        this.test = "";
        this.testcase = "";
        this.step = parentAction.step;
        this.sequence = parentAction.sequence;
        this.control = "Unknown";
        this.description = "";
        this.objType = "Unknown";
        this.value1 = "";
        this.value2 = "";
        this.fatal = "Y";
        this.conditionOper = "always";
        this.conditionVal1 = "";
        this.conditionVal2 = "";
        this.screenshotFileName = "";
    }

    this.parentStep = parentAction.parentStep;
    this.parentAction = parentAction;

    this.toDelete = false;
    this.hasPermissionsUpdate = canUpdate;

    this.html = $("<div></div>").addClass("step-action row").addClass("control");
}

Control.prototype.draw = function (afterControl) {
    var htmlElement = this.html;
    var control = this;
    var drag = $("<div></div>").addClass("drag-step-action col-lg-1").prop("draggable", true).append($("<div>").attr("id", "labelDiv"));
    var plusBtn = $("<button></button>").addClass("btn btn-default add-btn").append($("<span></span>").addClass("glyphicon glyphicon-chevron-down"));
    var addBtn = $("<button></button>").addClass("btn btn-success add-btn").append($("<span></span>").addClass("glyphicon glyphicon-plus"));
    var addABtn = $("<button></button>").addClass("btn btn-primary add-btn").append($("<span></span>").addClass("glyphicon glyphicon-plus"));
    var supprBtn = $("<button></button>").addClass("btn btn-danger add-btn").append($("<span></span>").addClass("glyphicon glyphicon-trash"));
    var btnGrp = $("<div></div>").addClass("col-lg-1").css("padding", "0px").append($("<div>").addClass("boutonGroup").append(addABtn).append(supprBtn).append(addBtn).append(plusBtn));
    var imgGrp = $("<div></div>").addClass("col-lg-1").css("height", "100%").append($("<span style='display: inline-block; height: 100%; vertical-align: middle;'></span>")).append($("<img>").attr("id", "ApplicationObjectImg").css("width", "100%"));

    var content = this.generateContent();

    if ((this.parentAction.parentStep.useStep === "N") && (control.hasPermissionsUpdate)) {
        drag.append($("<span></span>").addClass("fa fa-ellipsis-v"));
        drag.on("dragstart", handleDragStart);
        drag.on("dragenter", handleDragEnter);
        drag.on("dragover", handleDragOver);
        drag.on("dragleave", handleDragLeave);
        drag.on("drop", handleDrop);
        drag.on("dragend", handleDragEnd);
    }

    supprBtn.click(function () {
        setModif(true);
        control.toDelete = (control.toDelete) ? false : true;

        if (control.toDelete) {
            control.html.addClass("danger");
        } else {
            control.html.removeClass("danger");
        }
    });

    plusBtn.click(function () {
        var container = $(this).parent().parent().parent();
        container.find(".fieldRow:eq(2)").toggle();
        if ($(this).find("span").hasClass("glyphicon-chevron-down")) {
            $(this).find("span").removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up");
        } else {
            $(this).find("span").removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down");
        }
    });

    if ((this.parentStep.useStep === "Y") || (!control.hasPermissionsUpdate)) {
        supprBtn.attr("disabled", true);
        addBtn.attr("disabled", true);
        addABtn.attr("disabled", true);
    }

    var scope = this;

    addABtn.click(function () {
        addActionAndFocus(scope.parentAction);
    });

    addBtn.click(function () {
        addControlAndFocus(scope.parentAction, scope);
    });

    htmlElement.append(drag);
    htmlElement.append(content);
    htmlElement.append(imgGrp);
    htmlElement.append(btnGrp);
    htmlElement.data("item", this);

    if (afterControl == undefined) {
        this.parentAction.html.append(htmlElement);
    } else {
        afterControl.html.after(htmlElement);
    }
    this.refreshSort();
};

Control.prototype.setStep = function (step) {
    this.step = step;
};

Control.prototype.setSequence = function (sequence) {
    this.sequence = sequence;
};

Control.prototype.getControl = function () {
    return this.control;
}

Control.prototype.setControl = function (control) {
    this.control = control;
};

Control.prototype.setSort = function (sort) {
    this.sort = sort;
    this.refreshSort();
};

Control.prototype.refreshSort = function () {
    this.html.find("#labelDiv").empty().append($("<span>").text(this.parentAction.sort).addClass("label label-primary")).append($("<span>").text(this.sort).addClass("label label-success"));
};

Control.prototype.generateContent = function () {
    var obj = this;
    var doc = new Doc();
    var content = $("<div></div>").addClass("content col-lg-9");
    var firstRow = $("<div style='margin-top:15px;'></div>").addClass("fieldRow row form-group has-feedback");
    var secondRow = $("<div></div>").addClass("fieldRow row");
    var thirdRow = $("<div></div>").addClass("fieldRow row").hide();

    var controlList = $("<select></select>").addClass("form-control input-sm").css("width", "100%");
    var descField = $("<input>").addClass("description").addClass("form-control").prop("placeholder", doc.getDocLabel("page_testcasescript", "describe_control"));
    var controlValueField = $("<input>").attr("data-toggle", "tooltip").attr("data-animation", "false").attr("data-html", "true").attr("data-container", "body").attr("data-placement", "top").attr("data-trigger", "manual").addClass("form-control input-sm").css("width", "100%");
    var controlPropertyField = $("<input>").attr("data-toggle", "tooltip").attr("data-animation", "false").attr("data-html", "true").attr("data-container", "body").attr("data-placement", "top").attr("data-trigger", "manual").addClass("form-control input-sm").css("width", "100%");

    var controlconditionval1 = $("<input>").attr("type", "text").addClass("form-control input-sm");
    var controlconditionval2 = $("<input>").attr("type", "text").addClass("form-control input-sm");
    var controlconditionoper = $("<select></select>").addClass("form-control input-sm");
    var fatalList = $("<select></select>").addClass("form-control input-sm");

    descField.val(this.description);
    descField.css("width", "100%");
    descField.on("change", function () {
        obj.description = descField.val();
    });

    controlconditionval1.css("width", "100%");
    controlconditionval1.on("change", function () {
        obj.conditionVal1 = controlconditionval1.val();
    });
    controlconditionval1.val(this.conditionVal1);

    controlconditionval2.css("width", "100%");
    controlconditionval2.on("change", function () {
        obj.conditionVal2 = controlconditionval2.val();
    });
    controlconditionval2.val(this.conditionVal2);

    controlList = getSelectInvariant("CONTROL", false, true).attr("id", "controlSelect");
    controlList.val(this.control);
    controlList.css("width", "100%");
    controlList.on("change", function () {
        obj.control = controlList.val();
        setPlaceholderControl();
    });

    controlValueField.val(this.value1);
    controlValueField.css("width", "100%")
    controlValueField.on("change", function () {
        obj.value1 = controlValueField.val();
    });

    controlPropertyField.val(this.value2);
    controlPropertyField.css("width", "100%");
    controlPropertyField.on("change", function () {
        obj.value2 = controlPropertyField.val();
    });

    fatalList = getSelectInvariant("CTRLFATAL", false, true);
    fatalList.val(this.fatal);
    fatalList.css("width", "100%");
    fatalList.on("change", function () {
        obj.fatal = fatalList.val();
    });

    firstRow.append(descField);
    secondRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "control_field"))).append(controlList));
    secondRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value1_field"))).append(controlValueField));
    secondRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "value2_field"))).append(controlPropertyField));

    thirdRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "condition_parameter_field"))).append(controlconditionval1));
    thirdRow.append($("<div></div>").addClass("col-lg-4 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "condition_parameter_field"))).append(controlconditionval2));
    thirdRow.append($("<div></div>").addClass("col-lg-3 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "fatal_field"))).append(fatalList));


    controlconditionoper = getSelectInvariant("CONTROLCONDITIONOPER", false, true).css("width", "100%");
    controlconditionoper.on("change", function () {
        obj.conditionOper = controlconditionoper.val();
        if ((obj.conditionOper === "always") || (obj.conditionOper === "never")) {
            controlconditionval1.parent().hide();
            controlconditionval2.parent().hide();
        } else {
            controlconditionval1.parent().show();
            controlconditionval2.parent().show();
        }
    });
    controlconditionoper.val(this.conditionOper).trigger("change");

    thirdRow.prepend($("<div></div>").addClass("col-lg-3 form-group has-feedback").append($("<label></label>").text(doc.getDocLabel("page_testcasescript", "condition_operation_field"))).append(controlconditionoper));


    if ((this.parentStep.useStep === "Y") || (!obj.hasPermissionsUpdate)) {
        descField.prop("readonly", true);
        controlValueField.prop("readonly", true);
        controlPropertyField.prop("readonly", true);
        controlList.prop("disabled", "disabled");
        fatalList.prop("disabled", "disabled");
        controlconditionoper.prop("disabled", "disabled");
        controlconditionval1.prop("readonly", true);
        controlconditionval2.prop("readonly", true);
    }

    content.append(firstRow);
    content.append(secondRow);
    content.append(thirdRow);

    return content;
};

Control.prototype.getJsonData = function () {
    var json = {};

    json.toDelete = this.toDelete;
    json.test = this.test;
    json.testcase = this.testcase;
    json.step = this.step;
    json.sequence = this.sequence;
    json.control = this.control;
    json.sort = this.sort;
    json.description = this.description;
    json.objType = this.objType;
    json.controlSequence = this.controlSequence;
    json.value1 = this.value1;
    json.value2 = this.value2;
    json.fatal = this.fatal;
    json.conditionOper = this.conditionOper;
    json.conditionVal1 = this.conditionVal1;
    json.conditionVal2 = this.conditionVal2;
    json.screenshotFileName = this.screenshotFileName;

    return json;
};

/**
 * Call Add Action and focus to next description when 
 * focusing on description and clicking on enter
 * @returns {undefined}
 */
function listenEnterKeypressWhenFocusingOnDescription() {
    $("input[class='description form-control']").each(function (index, field) {
        $(field).off('keydown');
        $(field).on('keydown', function (e) {
            if (e.which === 13) {
                //if description is not empty, create new action
                if ($(field)[0].value.length !== 0) {
                    addActionAndFocus();
                } else {
                    //if description is empty, create action or control depending on field
                    if ($(field).closest(".step-action").hasClass("action")) {
                        var newAction = $(field).closest(".action-group");
                        var oldAction = newAction.prev().find(".step-action.row.action").last();
                        newAction.remove();
                        addControlAndFocus(oldAction);
                    } else {
                        var newAction = $(field).closest(".step-action");
                        newAction.remove();
                        addActionAndFocus();
                    }
                }
            }
        });
    });
}

function addControl(action, control) {
    setModif(true);
    var ctrl = new Control(null, action, true);
    action.setControl(ctrl, control);
    setAllSort();
    return ctrl;
}

function addControlAndFocus(oldAction, control) {
    $.when(addControl(oldAction, control)).then(function (action) {
        listenEnterKeypressWhenFocusingOnDescription();
        $($(action.html[0]).find(".description")[0]).focus();
        setPlaceholderControl();
        autocompleteAllFields();
    });
}

var autocompleteAllFields, getTags, setTags;
(function () {
    //var accessible only in closure
    var TagsToUse = [];
    var tcInfo;
    var test;
    var testcase;
    getTags = function () {
        return TagsToUse;
    };
    setTags = function (tags) {
        TagsToUse = tags;
    };
    //function accessible everywhere that has access to TagsToUse
    autocompleteAllFields = function (Tags, info, thistest, thistestcase) {
        if (Tags != undefined) {
            TagsToUse = Tags;
        }
        if (info != undefined) {
            tcInfo = info;
        }
        if (thistest != undefined) {
            test = thistest;
        }
        if (thistestcase != undefined) {
            testcase = thistestcase;
        }

        autocompleteVariable("#propTable .property .row:nth-child(1) textarea, div.step-action .content div.fieldRow div:nth-child(n+2) input, #stepHeader .step .content .fieldRow div:nth-child(n+2) input, #conditionVal1, #conditionVal2", TagsToUse);

        $("div.step-action .content div.fieldRow div:nth-child(n+2) input").each(function (i, e) {
            $(e).unbind("input").on("input", function (ev) {
                var name = undefined;
                var nameNotExist = undefined;
                var objectNotExist = false;
                var typeNotExist = undefined;
                var doc = new Doc();
                var checkObject = [];
                var betweenPercent = $(e).val().match(new RegExp(/%[^%]*%/g));
                if (betweenPercent != null && betweenPercent.length > 0) {
                    var i = betweenPercent.length - 1;
                    while (i >= 0) {
                        var findname = betweenPercent[i].match(/\.[^\.]*(\.|.$)/g);
                        if (betweenPercent[i].startsWith("%object.") && findname != null && findname.length > 0) {
                            name = findname[0];
                            name = name.slice(1, name.length - 1);

                            $(e).parent().parent().parent().parent().find("#ApplicationObjectImg").attr("src", "ReadApplicationObjectImage?application=" + tcInfo.application + "&object=" + name + "&time=" + new Date().getTime());

                            if (TagsToUse[1].array.indexOf(name) < 0) {
                                objectNotExist = true;
                                nameNotExist = name;
                                typeNotExist = "applicationobject";
                            }
                        } else if (betweenPercent[i].startsWith("%property.") && findname != null && findname.length > 0) {
                            name = findname[0];
                            name = name.slice(1, name.length - 1);

                            if (TagsToUse[2].array.indexOf(name) < 0) {
                                objectNotExist = true;
                                nameNotExist = name;
                                typeNotExist = "property";
                            }
                        }
                        i--;
                    }
                }
                if (objectNotExist) {
                    if (typeNotExist == "applicationobject") {
                        var newTitle = "<a style='color: #fff;' href='#' onclick='addApplicationObjectModalClick(undefined, \"" + nameNotExist + "\",\"" + tcInfo.application + "\")'><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span>" + doc.getDocLabel("page_global", "warning") + ": " + nameNotExist + " " + doc.getDocLabel("page_testcasescript", "not_application_object") + "</a>";
                        if (newTitle != $(e).attr('data-original-title')) {
                            $(e).attr('data-original-title', newTitle).tooltip('fixTitle').tooltip('show');
                        } else {
                            $(e).tooltip('show');
                        }
                    } else if (typeNotExist == "property") {
                        //TODO better way to add property
                        var newTitle = "<a style='color: #fff;' href='#' onclick=\"$('#manageProp').click();$('#addProperty').click();$('#propTable input#propName:last-child').val('" + nameNotExist + "').trigger('change');\"><span class='glyphicon glyphicon-exclamation-sign' aria-hidden='true'></span> " + doc.getDocLabel("page_global", "warning") + " : " + nameNotExist + " " + doc.getDocLabel("page_testcasescript", "not_property") + "</a>";
                        if (newTitle != $(e).attr('data-original-title')) {
                            $(e).attr('data-original-title', newTitle).tooltip('fixTitle').tooltip('show');
                        } else {
                            $(e).tooltip('show');
                        }
                    }
                } else {
                    $(e).attr('data-original-title', "").attr('title', "").tooltip('destroy');
                }
            });
        }).trigger("input");
    };
})();

function removeTestCaseClick(test, testCase) {
    clearResponseMessageMainPage();
    var doc = new Doc();
    var messageComplete = doc.getDocLabel("page_testcase", "message_delete");
    messageComplete = messageComplete.replace("%ENTRY%", test + " / " + testCase);
    showModalConfirmation(deleteTestCaseHandlerClick, "Delete", messageComplete, test, testCase, "", "");
}

/*
 * Function called when confirmation button pressed
 * @returns {undefined}
 */
function deleteTestCaseHandlerClick() {
    var test = $('#confirmationModal').find('#hiddenField1').prop("value");
    var testCase = $('#confirmationModal').find('#hiddenField2').prop("value");
    var jqxhr = $.post("DeleteTestCase2", {test: test, testCase: testCase}, "json");
    $.when(jqxhr).then(function (data) {
        var messageType = getAlertType(data.messageType);
        if (messageType === "success") {
            window.location = "./TestCaseScript.jsp?test=" + test;
        }
        //show message in the main page
        showMessageMainPage(messageType, data.message);
        //close confirmation window
        $('#confirmationModal').modal('hide');
    }).fail(handleErrorAjaxAfterTimeout);
}

editPropertiesModalClick = function (test, testcase, info, propertyToAdd, propertyToFocus, canUpdate) {
    $("#propTable").empty();
    loadProperties(test, testcase, info, propertyToFocus, canUpdate).then(function () {
        autocompleteAllFields();
    });
    if (propertyToAdd != undefined && propertyToAdd != null) {
        // Building full list of country from testcase.
        var myCountry = [];
        $.each(info.countryList, function (index) {
            myCountry.push(index);
        });

        var newProperty = {
            property: propertyToAdd,
            description: "",
            country: myCountry,
            type: "text",
            database: "",
            value1: "",
            value2: "",
            length: 0,
            rowLimit: 0,
            nature: "STATIC",
            toDelete: false
        };

        drawProperty(newProperty, info, true);
    }

    $("#propertiesModal").modal('show');
};

function editPropertiesModalSaveHandler() {
    clearResponseMessage($('#propertiesModal'));
    var doc = new Doc();

    var properties = $("#propTable #masterProp");
    var propArr = [];
    var propertyWithoutCountry = false;
    for (var i = 0; i < properties.length; i++) {
        if ($(properties[i]).data("property").country.length <= 0) {
            propertyWithoutCountry = true;
        }
        propArr.push($(properties[i]).data("property"));
    }
    var saveProp = function () {
        showLoaderInModal('#propertiesModal');
        $.ajax({
            url: "UpdateTestCaseProperties1",
            async: true,
            method: "POST",
            data: {
                informationInitialTest: GetURLParameter("test"),
                informationInitialTestCase: GetURLParameter("testcase"),
                informationTest: GetURLParameter("test"),
                informationTestCase: GetURLParameter("testcase"),
                propArr: JSON.stringify(propArr)
            },
            success: function (data) {
                var Tags = getTags();

                var array = [];

                for (var i = 0; i < propArr.length; i++) {
                    array.push(propArr[i].property);
                }

                for (var i = 0; i < Tags.length; i++) {
                    if (Tags[i].regex == "%property\\.") {
                        Tags[i].array = array;
                    }
                }

                hideLoaderInModal('#propertiesModal');
                if (getAlertType(data.messageType) === 'success') {
                    $("div.step-action .content div.fieldRow div:nth-child(n+2) input").trigger("input");
                    showMessage(data);
                    $('#propertiesModal').modal('hide');
                } else {
                    showMessage(data, $('#propertiesModal'));
                }
            },
            error: showUnexpectedError
        });
    };

    if (propertyWithoutCountry) {
        showModalConfirmation(function () {
            $('#confirmationModal').modal('hide');
            saveProp();
        }, doc.getDocLabel("page_global", "btn_savetableconfig"), doc.getDocLabel("page_testcasescript", "warning_no_country"), "", "", "", "");
    } else {
        saveProp();
    }
}

function setPlaceholderAction() {
    /**
     * Todo : GetFromDatabase
     */
    var placeHoldersList = {"fr": [
            {"type": "Unknown", "object": null, "property": null},
            {"type": "keypress", "object": "[opt] Chemin vers l'élement à cibler", "property": ""},
            {"type": "hideKeyboard", "object": null, "property": null},
            {"type": "swipe", "object": "Action (UP DOWN LEFT RIGHT CUSTOM...)", "property": "Direction x;y;z;y"},
            {"type": "click", "object": "Chemin vers l'élement à cliquer", "property": null},
            {"type": "mouseLeftButtonPress", "object": "Chemin vers l'élement à cibler", "property": null},
            {"type": "mouseLeftButtonRelease", "object": "Chemin vers l'élement", "property": null},
            {"type": "doubleClick", "object": "Chemin vers l'élement à double-cliquer", "property": null},
            {"type": "rightClick", "object": "Chemin vers l'élement à clicker avec le bouton droit", "property": null},
            {"type": "focusToIframe", "object": "Identifiant de l'iFrame à cibler", "property": null},
            {"type": "focusDefaultIframe", "object": null, "property": null},
            {"type": "switchToWindow", "object": "Identifiant de fenêtre", "property": null},
            {"type": "manageDialog", "object": "ok ou cancel", "property": null},
            {"type": "mouseOver", "object": "Chemin vers l'élement", "property": null},
            {"type": "mouseOverAndWait", "object": "Action Depreciée", "property": "Action Depreciée"},
            {"type": "openUrlWithBase", "object": "/URI à appeler", "property": null},
            {"type": "openUrlLogin", "object": null, "property": null},
            {"type": "openUrl", "object": "URL à appeler", "property": null},
            {"type": "select", "object": "Chemin vers l'élement", "property": "Chemin vers l'option"},
            {"type": "type", "object": "Chemin vers l'élement", "property": "Nom de propriété"},
            {"type": "wait", "object": "Valeur(ms) ou élement", "property": null},
            {"type": "callSoap", "object": "Nom du Soap (librairie)", "property": "Nom de propriété"},
            {"type": "callSoapWithBase", "object": "Nom du Soap (librairie)", "property": "Nom de propriété"},
            {"type": "removeDifference", "object": "Action Depreciée", "property": "Action Depreciée"},
            {"type": "executeSqlUpdate", "object": "Nom de Base de donnée", "property": "Script à executer"},
            {"type": "executeSqlStoredProcedure", "object": "Nom de Base de donnée", "property": "Procedure Stoquée à executer"},
            {"type": "calculateProperty", "object": "Nom d'une Proprieté", "property": "[opt] Nom d'une autre propriété"},
            {"type": "doNothing", "object": null, "property": null},
            {"type": "getPageSource", "object": null, "property": null}
        ], "en": [
            {"type": "Unknown", "object": null, "property": null},
            {"type": "keypress", "object": "[opt] Element path", "property": ""},
            {"type": "hideKeyboard", "object": null, "property": null},
            {"type": "swipe", "object": "Action (UP DOWN LEFT RIGHT CUSTOM...)", "property": "Direction x;y;z;y"},
            {"type": "click", "object": "Element path", "property": null},
            {"type": "mouseLeftButtonPress", "object": "Element path", "property": null},
            {"type": "mouseLeftButtonRelease", "object": "Element path", "property": null},
            {"type": "doubleClick", "object": "Element path", "property": null},
            {"type": "rightClick", "object": "Element path", "property": null},
            {"type": "focusToIframe", "object": "Id of the target iFrame", "property": null},
            {"type": "focusDefaultIframe", "object": null, "property": null},
            {"type": "switchToWindow", "object": "Window id", "property": null},
            {"type": "manageDialog", "object": "ok or cancel", "property": null},
            {"type": "mouseOver", "object": "Element path", "property": null},
            {"type": "mouseOverAndWait", "object": "Deprecated", "property": "Deprecated"},
            {"type": "openUrlWithBase", "object": "/URI to call", "property": null},
            {"type": "openUrlLogin", "object": null, "property": null},
            {"type": "openUrl", "object": "URL to call", "property": null},
            {"type": "select", "object": "Element path", "property": "Option path"},
            {"type": "type", "object": "Element path", "property": "Property Name"},
            {"type": "wait", "object": "Time(ms) or Element", "property": null},
            {"type": "callSoap", "object": "Soap Name (library)", "property": "Property Name"},
            {"type": "callSoapWithBase", "object": "Soap Name (library)", "property": "Property Name"},
            {"type": "removeDifference", "object": "Deprecated", "property": "Deprecated"},
            {"type": "executeSqlUpdate", "object": "Database Name", "property": "Script"},
            {"type": "executeSqlStoredProcedure", "object": "Database Name", "property": "Stored Procedure"},
            {"type": "calculateProperty", "object": "Property Name", "property": "[opt] Name of an other property"},
            {"type": "doNothing", "object": null, "property": null},
            {"type": "getPageSource", "object": null, "property": null}
        ]};

    var user = getUser();
    var placeHolders = placeHoldersList[user.language];

    $('select#actionSelect option:selected').each(function (i, e) {
        for (var i = 0; i < placeHolders.length; i++) {
            if (placeHolders[i].type === e.value) {
                if (placeHolders[i].object !== null) {
                    $(e).parent().parent().next().show();
                    $(e).parent().parent().next().find('label').text(placeHolders[i].object);
                } else {
                    $(e).parent().parent().next().hide();
                }
                if (placeHolders[i].property !== null) {
                    $(e).parent().parent().next().next().show();
                    $(e).parent().parent().next().next().find('label').text(placeHolders[i].property);
                } else {
                    $(e).parent().parent().next().next().hide();
                }
            }
        }
    });
}

function setPlaceholderControl() {
    /**
     * Todo : GetFromDatabase
     */
    var placeHoldersList = {"fr": [
            {"type": "Unknown", "controlValue": null, "controlProp": null, "fatal": null},
            {"type": "verifyStringEqual", "controlValue": "String2", "controlProp": "String1", "fatal": ""},
            {"type": "verifyStringDifferent", "controlValue": "String2", "controlProp": "String1", "fatal": ""},
            {"type": "verifyStringGreater", "controlValue": "String2 ex : AAA", "controlProp": "String1 ex: ZZZ", "fatal": ""},
            {"type": "verifyStringMinor", "controlValue": "String2 ex : ZZZ", "controlProp": "String1 ex: AAA", "fatal": ""},
            {"type": "verifyStringContains", "controlValue": "String2 ex : toto", "controlProp": "String1 ex : ot", "fatal": ""},
            {"type": "verifyIntegerEquals", "controlValue": "Integer2", "controlProp": "Integer1", "fatal": ""},
            {"type": "verifyIntegerDifferent", "controlValue": "Integer2", "controlProp": "Integer1", "fatal": ""},
            {"type": "verifyIntegerGreater", "controlValue": "Integer2 ex : 10", "controlProp": "Integer1 ex : 20", "fatal": ""},
            {"type": "verifyIntegerMinor", "controlValue": "Integer2 ex : 20", "controlProp": "Integer1 ex : 10", "fatal": ""},
            {"type": "verifyElementPresent", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementNotPresent", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementVisible", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementNotVisible", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementEquals", "controlValue": "Expected element", "controlProp": "XPath of the element", "fatal": ""},
            {"type": "verifyElementDifferent", "controlValue": "Not Expected element", "controlProp": "XPath of the element", "fatal": ""},
            {"type": "verifyElementInElement", "controlValue": "Sub Element", "controlProp": "Master Element", "fatal": ""},
            {"type": "verifyElementClickable", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementNotClickable", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyTextInElement", "controlValue": "Text", "controlProp": "Element", "fatal": ""},
            {"type": "verifyTextNotInElement", "controlValue": "Text", "controlProp": "Element", "fatal": ""},
            {"type": "verifyRegexInElement", "controlValue": "Regex", "controlProp": "Element", "fatal": ""},
            {"type": "verifyTextInPage", "controlValue": null, "controlProp": "Regex", "fatal": ""},
            {"type": "verifyTextNotInPage", "controlValue": null, "controlProp": "Regex", "fatal": ""},
            {"type": "verifyTitle", "controlValue": null, "controlProp": "Title", "fatal": ""},
            {"type": "verifyUrl", "controlValue": null, "controlProp": "URL", "fatal": ""},
            {"type": "verifyTextInDialog", "controlValue": null, "controlProp": "Text", "fatal": ""},
            {"type": "verifyXmlTreeStructure", "controlValue": "Tree", "controlProp": "XPath", "fatal": ""},
            {"type": "takeScreenshot", "controlValue": null, "controlProp": null, "fatal": null},
            {"type": "getPageSource", "controlValue": null, "controlProp": null, "fatal": null}
        ], "en": [
            {"type": "Unknown", "controlValue": null, "controlProp": null, "fatal": null},
            {"type": "verifyStringEqual", "controlValue": "String2", "controlProp": "String1", "fatal": ""},
            {"type": "verifyStringDifferent", "controlValue": "String2", "controlProp": "String1", "fatal": ""},
            {"type": "verifyStringGreater", "controlValue": "String2 ex : AAA", "controlProp": "String1 ex: ZZZ", "fatal": ""},
            {"type": "verifyStringMinor", "controlValue": "String2 ex : ZZZ", "controlProp": "String1 ex: AAA", "fatal": ""},
            {"type": "verifyStringContains", "controlValue": "String2 ex : toto", "controlProp": "String1 ex : ot", "fatal": ""},
            {"type": "verifyIntegerEquals", "controlValue": "Integer2", "controlProp": "Integer1", "fatal": ""},
            {"type": "verifyIntegerDifferent", "controlValue": "Integer2", "controlProp": "Integer1", "fatal": ""},
            {"type": "verifyIntegerGreater", "controlValue": "Integer2 ex : 10", "controlProp": "Integer1 ex : 20", "fatal": ""},
            {"type": "verifyIntegerMinor", "controlValue": "Integer2 ex : 20", "controlProp": "Integer1 ex : 10", "fatal": ""},
            {"type": "verifyElementPresent", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementNotPresent", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementVisible", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementNotVisible", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementEquals", "controlValue": "Expected element", "controlProp": "XPath of the element", "fatal": ""},
            {"type": "verifyElementDifferent", "controlValue": "Not Expected element", "controlProp": "XPath of the element", "fatal": ""},
            {"type": "verifyElementInElement", "controlValue": "Sub Element", "controlProp": "Master Element", "fatal": ""},
            {"type": "verifyElementClickable", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyElementNotClickable", "controlValue": null, "controlProp": "Element ex : data-cerberus=fieldToto", "fatal": ""},
            {"type": "verifyTextInElement", "controlValue": "Text", "controlProp": "Element", "fatal": ""},
            {"type": "verifyTextNotInElement", "controlValue": "Text", "controlProp": "Element", "fatal": ""},
            {"type": "verifyRegexInElement", "controlValue": "Regex", "controlProp": "Element", "fatal": ""},
            {"type": "verifyTextInPage", "controlValue": null, "controlProp": "Regex", "fatal": ""},
            {"type": "verifyTextNotInPage", "controlValue": null, "controlProp": "Regex", "fatal": ""},
            {"type": "verifyTitle", "controlValue": null, "controlProp": "Title", "fatal": ""},
            {"type": "verifyUrl", "controlValue": null, "controlProp": "URL", "fatal": ""},
            {"type": "verifyTextInDialog", "controlValue": null, "controlProp": "Text", "fatal": ""},
            {"type": "verifyXmlTreeStructure", "controlValue": "Tree", "controlProp": "XPath", "fatal": ""},
            {"type": "takeScreenshot", "controlValue": null, "controlProp": null, "fatal": null},
            {"type": "getPageSource", "controlValue": null, "controlProp": null, "fatal": null}
        ]};

    var user = getUser();
    var placeHolders = placeHoldersList[user.language];

    $('select#controlSelect option:selected').each(function (i, e) {

        for (var i = 0; i < placeHolders.length; i++) {
            if (placeHolders[i].type === e.value) {
                if (placeHolders[i].controlProp !== null) {
                    $(e).parent().parent().next().show();
                    $(e).parent().parent().next().find('label').text(placeHolders[i].controlProp);
                } else {
                    $(e).parent().parent().next().hide();
                }
                if (placeHolders[i].controlValue !== null) {
                    $(e).parent().parent().next().next().show();
                    $(e).parent().parent().next().next().find('label').text(placeHolders[i].controlValue);
                } else {
                    $(e).parent().parent().next().next().hide();
                }
                if (placeHolders[i].fatal !== null) {
                    $(e).parent().parent().next().next().next().show();
                } else {
                    $(e).parent().parent().next().next().next().hide();
                }
            }
        }
    });
}

function setPlaceholderProperty() {
    /**
     * Todo : GetFromDatabase
     */
    var placeHoldersList = {"fr": [
            {"type": "text", "database": null, "length": null, "rowLimit": null, "nature": null},
            {"type": "executeSql", "database": null, "length": null, "rowLimit": null, "nature": null}
        ], "en": [
            {"type": "text", "database": null, "length": null, "rowLimit": null, "nature": null},
            {"type": "executeSql", "database": null, "length": null, "rowLimit": null, "nature": null}
        ]};

    var user = getUser();
    var placeHolders = placeHoldersList[user.language];


    $('div[class="rowProperty form-inline"] option:selected').each(function (i, e) {
        for (var i = 0; i < placeHolders.length; i++) {
            if (placeHolders[i].type === e.value) {
                if (placeHolders[i].controlValue !== null) {
                    $(e).parent().parent().next().show();
                    $(e).parent().parent().next().find('input').prop("placeholder", placeHolders[i].controlValue);
                } else {
                    $(e).parent().parent().next().hide();
                }
                if (placeHolders[i].controlProp !== null) {
                    $(e).parent().parent().next().next().show();
                    $(e).parent().parent().next().next().find('input').prop("placeholder", placeHolders[i].controlProp);
                } else {
                    $(e).parent().parent().next().next().hide();
                }
                if (placeHolders[i].fatal !== null) {
                    $(e).parent().parent().next().next().next().show();
                } else {
                    $(e).parent().parent().next().next().next().hide();
                }
            }
        }
    });

}

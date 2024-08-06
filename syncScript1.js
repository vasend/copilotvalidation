'use strict';
app.sync = kendo.observable({
    onShow: function (e) {
        //if (app.IsLoggedIn == 0) {
        //    app.application.navigate("components/signin/view.html");
        //    return;
        //}
        ////debugger;
        isRunning = false;
        if (app.IsOnline == true) {
            ////alert("hi");
            $("#txtCheckList_Checked1").prop("checked", true);
            $(".homeIsonline").css("color", "green");
            $(".homeIsonline").html("Online");
            //$("#txtCheckList_Checked2").prop("checked", false);
        }
        else {
            $("#txtCheckList_Checked1").prop("checked", false);
            $(".homeIsonline").css("color", "red");
            $(".homeIsonline").html("Offline");
            //$("#txtCheckList_Checked2").prop("checked", true);
        }
        if (window.localStorage.getItem("Lastsync") != undefined) {
            $(".homesyncdate").html("Last synced: " + window.localStorage.getItem("Lastsync"));
        }

    },
    syncDBRecent: function () {

        $("#hdnSearchtype").val('true');
        this.syncDB();
    },
    gotooffline: function () {

        $("#txtCheckList_Checked1").prop("checked", false);
        localStorage.setItem("IsOnline", false);
        app.IsOnline = false;
        $(".homeIsonline").css("color", "red");
        $(".homeIsonline").html("Offline");
        if (app.IsLoggedIn == "1") {
            //kendo.mobile.application.hideLoading();
            setTimeout(function () { app.application.navigate("components/servicerequest/view.html"); }, 500);
        }
        else {
            // kendo.mobile.application.hideLoading();
            app.application.navigate("components/signin/view.html");
        }
    },
    gotoonline: function () {

        $("#txtCheckList_Checked1").prop("checked", true);
        //$("#txtCheckList_Checked2").prop("checked", false);
        localStorage.setItem("IsOnline", true);
        app.IsOnline = true;
        $(".homeIsonline").css("color", "green");
        $(".homeIsonline").html("Online");
        if (app.IsLoggedIn == "1") {
            //kendo.mobile.application.hideLoading();
            setTimeout(function () { app.application.navigate("components/servicerequest/view.html"); }, 500);
        }
        else {
            // kendo.mobile.application.hideLoading();
            app.application.navigate("components/signin/view.html");
        }

    },
    syncDB: function () {
        var value = $("#txtCheckList_Checked1").is(":checked");

        if (value == false) {
            $("#syncStatus").html("Online should be checked.");
            window.plugins.toast.showLongTop('Please check the online checkbox.', null, null);
            isRunning = false;
            return;
        }
        if (app.UserId == null || app.UserId == '') {
            window.plugins.toast.showLongTop('Please login with a valid user.', null, null);
            isRunning = false;
            return;
        }

        if (app.ServerUrl.length > 0) {

            setTimeout(function () { $(".km-loader").show(); }, 500);

            setTimeout(function () { }, 2500);

            //$(".km-loader").show();
            kendo.mobile.application.showLoading();
            window.plugins.toast.showLongTop('Sync started please wait...');
            $("#syncStatus").html("Sync started... Please wait");
            // SpinnerDialog.show();
            //SyncData
            var main_function = this;
            var func = setTimeout((function () {
                main_function.syncData();

                //Clear DB
                app.ClearDB();

                // //alert('DB cleared now.');

                //Get Service Request Information
                if (app.IsQILogin > 0 || (app.IsQILogin == 0 && app.IsfactoryAuditLogin == 0)) {
                    app.sync.syncServiceRequest();
                }
                //Get Factory Audit Information
                if (app.IsfactoryAuditLogin > 0 || (app.IsQILogin == 0 && app.IsfactoryAuditLogin == 0)) {
                    app.sync.syncFactoryRequest();
                }

                $("#syncStatus").html("Sync completed");

                var SyncDate = new Date();
                window.localStorage.setItem("Lastsync", kendo.toString(SyncDate, "dd/MM/yyyy h:mm:ss tt"));

                $(".homesyncdate").html("Last synced: " + window.localStorage.getItem("Lastsync"));
                kendo.mobile.application.hideLoading();
                setTimeout(function () { $(".km-loader").hide(); }, 500);
                app.application.navigate("components/sync/view.html");
            }), 3000);


            //  setTimeout(function () { $(".km-loader").hide(); }, 3000);

        }
        else {
            // setTimeout(function () { $(".km-loader").hide(); }, 3000)
            //$(".km-loader").hide();
            isRunning = false;
            window.plugins.toast.showLongTop('Please configure server url.', null, null);
        }

    },

    syncData: function () {


        //Get Service Request Information
        if (app.IsQILogin > 0 || (app.IsQILogin == 0 && app.IsfactoryAuditLogin == 0)) {
            app.sync.SRCheckListSave();
            app.sync.SRProductionStatusSave();
            app.sync.SRUploadSave();
            app.sync.SRDefectDetailsNumbersSave();
            app.sync.SRDefectDetailsSave();
        }
        //Get Factory Audit Information
        if (app.IsfactoryAuditLogin > 0 || (app.IsQILogin == 0 && app.IsfactoryAuditLogin == 0)) {
            app.sync.FRAuditParameterSave();
            app.sync.FRAuditCommentsSave();
            app.sync.FRAuditUploadDataSave();
            app.sync.FRAuditProductionUploadDataSave();
        }
        console.log('Here Iam working1');
        app.sync.UploadAllFilesImage();

        ////alert('DB cleared now.');
        //Clear DB
        // app.ClearDB();
    },

    SRCheckListSave: function () {
        $("#syncStatus").html("SRCheclistSave ... started");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, servicerequestid, servicerequestlineid, jsondata from tblServiceRequestLineCheckListSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).servicerequestid;
                        var requestLineId = res.rows.item(i).servicerequestlineid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }
                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveServiceRequestCheckList',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblServiceRequestLineCheckListSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("SRCheclistSave ... end");
                }
                else {
                    $("#syncStatus").html("SRCheclistSave ... end");
                }
            });
        });
    },
    SRProductionStatusSave: function () {
        $("#syncStatus").html("SRProductionStatusSave ... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, servicerequestid, servicerequestlineid, jsondata from tblServiceRequestLineProductionStatusSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).servicerequestid;
                        var requestLineId = res.rows.item(i).servicerequestlineid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }
                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveServiceRequestProductionStatus',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblServiceRequestLineProductionStatusSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("SRProductionStatusSave ... end");
                }
                else {
                    $("#syncStatus").html("SRProductionStatusSave ... end");
                }
            });
        });
    },
    SRUploadSave: function () {
        $("#syncStatus").html("SRUploadSave ... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, servicerequestid, servicerequestlineid, typeid, jsondata from tblServiceRequestLineUploadSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).servicerequestid;
                        var requestLineId = res.rows.item(i).servicerequestlineid;
                        var typeid = res.rows.item(i).typeid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        arr.push(arr1);

                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveServiceRequestUploadComments',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblServiceRequestLineUploadSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("SRUploadSave ... end");
                }
                else {
                    $("#syncStatus").html("SRUploadSave ... end");
                }
            });
        });
    },
    SRDefectDetailsNumbersSave: function () {
        $("#syncStatus").html("SRDefectDetailsNumbersSave ... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, servicerequestid, servicerequestlineid, jsondata from tblServiceRequestLineDefectDetailsSaveNumbers where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).servicerequestid;
                        var requestLineId = res.rows.item(i).servicerequestlineid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }

                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveServiceRequestDetectList',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblServiceRequestLineDefectDetailsSaveNumbers set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("SRDefectDetailsNumbersSave ... end");
                }
                else {
                    $("#syncStatus").html("SRDefectDetailsNumbersSave ... end");
                }
            },
                function (tx, res) {
                    ////alert(res);
                });
        });
    },
    SRDefectDetailsSave: function () {
        $("#syncStatus").html("SRDefectDetailsSave... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, servicerequestid, servicerequestlineid, jsondata from tblServiceRequestLineDefectDetailsSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).servicerequestid;
                        var requestLineId = res.rows.item(i).servicerequestlineid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }
                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveServiceRequestDetectList',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblServiceRequestLineDefectDetailsSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("SRDefectDetailsSave... end");
                }
                else {
                    $("#syncStatus").html("SRDefectDetailsSave... end");
                }
            },
                function (tx, res) {
                    ////alert(res);
                });
        });
    },
    //    function errorHandler(transaction, error)
    //    {
    //        //debugger;
    //console.log(error);
    //}
    FRAuditParameterSave: function () {
        $("#syncStatus").html("FRAuditParameterSave... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, factoryrequestid, jsondata from tblFactoryRequestSaveAuditParameter where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).factoryrequestid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }

                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveAuditParameter',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: requestId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblFactoryRequestSaveAuditParameter set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("FRAuditParameterSave... end");
                }
                else {
                    $("#syncStatus").html("FRAuditParameterSave... end");
                }
            });
        });
    },
    FRAuditCommentsSave: function () {
        $("#syncStatus").html("FRAuditParameterSave... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, factoryrequestid, jsondata from tblFactoryRequestAuditCommentsSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).factoryrequestid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }

                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveAuditParameter',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: requestId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblFactoryRequestAuditCommentsSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("FRAuditParameterSave... end");
                }
                else {
                    $("#syncStatus").html("FRAuditParameterSave... end");
                }
            });
        });
    },
    FRAuditUploadDataSave: function () {
        $("#syncStatus").html("FRAuditUploadDataSave... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, factoryrequestid, jsondata from tblFactoryRequestGetAuditUploadDataSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).factoryrequestid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }

                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveAuditUploadData',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: requestId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblFactoryRequestGetAuditUploadDataSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("FRAuditUploadDataSave... end");
                }
                else {
                    $("#syncStatus").html("FRAuditUploadDataSave... end");
                }
            });
        });
    },
    FRAuditProductionUploadDataSave: function () {
        $("#syncStatus").html("FRAuditProductionUploadDataSave... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, factoryrequestid, jsondata from tblFactoryRequestGetAuditProductionUploadDataSave where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var requestId = res.rows.item(i).factoryrequestid;
                        var arr1 = res.rows.item(i).jsondata;
                        var arr = [];
                        var array = arr1.split(',');
                        for (var j = 0; j < array.length; j++) {
                            arr.push(array[j]);
                        }

                        $.ajax({
                            url: app.ServerUrl + '/QMSApp/SaveAuditProductionUploadData',
                            dataType: "json",
                            method: "POST",
                            async: false,
                            timeout: 30000,
                            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: requestId, valueList: arr },
                            success: function (result) {
                                app.Execute("update tblFactoryRequestGetAuditProductionUploadDataSave set isupdated='1' where id=" + id);
                            },
                            error: function (e) {
                            }
                        });
                    }
                    $("#syncStatus").html("FRAuditProductionUploadDataSave... end");
                }
                else {
                    $("#syncStatus").html("FRAuditProductionUploadDataSave... end");
                }
            });
        });
    },

    UploadAllFilesImage: function () {
        $("#syncStatus").html("UploadAllFilesImage... start");
        app.DB.transaction(function (tx) {
            tx.executeSql("SELECT id, value1, value2,ctype,cid,imgname,data1,counter from tblUploadAllFilesImage where isupdated='0'", [], function (tx, res) {
                if (res.rows.length > 0) {
                    ////alert(res.rows.length);
                    for (var i = 0; i < res.rows.length; i++) {
                        var id = res.rows.item(i).id;
                        var value1 = res.rows.item(i).value1;
                        var value2 = res.rows.item(i).value2;
                        var ctype = res.rows.item(i).ctype;
                        var cid = res.rows.item(i).cid;
                        var imgname = res.rows.item(i).imgname;
                        var data1 = res.rows.item(i).data1;
                        var id3 = 0;
                        console.log('Here Iam working2');
                        try {
                            $.ajax({
                                url: app.ServerUrl + '/OrderManagement/UploadAllFilesBase64Image', //?id=' + id + '&id1=' + id1 + '&id3=' + id3 + '&typeid=' + ctype + '&controlid=' + cid,
                                type: "POST",
                                timeout: 30000,
                                async: false,
                                data: { id: value1, id1: value2, id3: id3, typeid: ctype, counter: '', controlid: cid, fileName: imgname, base64: data1, Comment: '' },
                                success: function (result) {
                                    ////alert('Here I am working 3');
                                    if (result.Success == true) {
                                        app.Execute("update tblUploadAllFilesImage set isupdated='1' where id=" + id);

                                    } else {

                                    }
                                },
                            });
                        } catch (e) {

                        }
                    }
                    $("#syncStatus").html("Sync completed");
                }
                else {
                    $("#syncStatus").html("Sync completed");
                }
            });
        });
    },

    syncServiceRequest: function () {
        $("#syncStatus").html("syncServiceRequest... start");
        var servicerequestnumber = "";
        var factory = "";
        var category = "";
        var searchtype = $("#hdnSearchtype").val();
        kendo.mobile.application.showLoading();
        app.ServiceRequest = new kendo.data.DataSource();

        $.ajax({
            url: app.ServerUrl + '/QMSApp/FindServiceRequestForDBSync',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, latestcheck: searchtype },
            success: function (result) {
                if (result.data != null) {
                    var d1 = JSON.parse(result.data);
                    var id = "";
                    var servicerequestid = "";
                    var factory = "";
                    var category = "";
                    var subcategory = "";
                    var inspectiontype = "";
                    var location = "";
                    var factorylocation = "";
                    var buyercompany = "";
                    var exfactorydate = "";
                    var allocationstartdate = "";
                    var allocationenddate = "";
                    var code = "";
                    for (var i = 0; i < d1.length; i++) {
                        ////debugger;
                        var data = d1[i];
                        try {
                            id = data.Id;
                            servicerequestid = data.Code;
                            factory = data.smBuyer;
                            category = data.CategoryId;
                            subcategory = data.SubCategoryId;
                            inspectiontype = data.smInspectionType;
                            factorylocation = data.smLocation;
                            buyercompany = data.smBuyer;
                            code = data.Code;

                            if (data.InspectionDate != null) {
                                var d = eval(data.InspectionDate.replace(/\/Date\((\d+)\)\//gi, "new Date($1)"));
                                allocationstartdate = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
                            }
                            if (data.AllocatedInpsectionEndDate != null) {
                                var d = eval(data.AllocatedInpsectionEndDate.replace(/\/Date\((\d+)\)\//gi, "new Date($1)"));
                                allocationenddate = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
                            }

                        } catch (e) {

                        }

                        app.InsertServiceRequest(id, servicerequestid, factory, category, subcategory, inspectiontype, location, factorylocation, buyercompany, exfactorydate, allocationstartdate, allocationenddate, code);

                        app.sync.syncServiceRequestSKU(id);
                        $("#syncStatus").html("  " + code + " SR added for offline work.");

                    }

                    $("#hdnSearchtype").val('false');
                    //$("#syncStatus").html("Sync Completed.");
                    $("#syncStatus").html("syncServiceRequest... end");
                    //setTimeout(function () { $(".km-loader").hide(); }, 5000);

                }
                else {
                    $("#hdnSearchtype").val('false');
                    //setTimeout(function () { $(".km-loader").hide(); }, 5000);
                    //window.location.reload(true);
                    $("#syncStatus").html("syncServiceRequest... end");

                }
                $("#hdnSearchtype").val('false');

            }
        });
    },

    syncServiceRequestSKU: function (id) {
        $("#syncStatus").html("syncServiceRequestSKU... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetSKUFromServiceRequest',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: id },
            success: function (result) {
                var json1 = "";
                var json2 = "";
                if (result.data != null) {
                    json1 = JSON.stringify(result.data);
                    json1 = json1.replace("'", "`")
                }

                if (result.data1 != null) {
                    json2 = JSON.stringify(result.data1);
                    json2 = json2.replace("'", "`")
                }

                app.InsertServiceRequestSKU(id, json1, json2);

                if (result.data != null) {
                    for (var i = 0; i < result.data.length; i++) {
                        var requestLineId = result.data[i].Id;

                        app.sync.syncServiceRequestLineCheckList(id, requestLineId);
                        app.sync.syncServiceRequestLineProductionStatus(id, requestLineId);
                        app.sync.syncServiceRequestLineProductionComments(id, requestLineId);
                        app.sync.syncServiceRequestLineUpload(id, requestLineId);
                        app.sync.syncServiceRequestDefectHeader(id, requestLineId);
                        app.sync.syncServiceRequestDefectHeaderData(id, requestLineId);
                        app.sync.syncServiceRequestDefectDetailsNew(id, requestLineId, 0);
                        app.sync.syncServiceRequestDefectFooderData(id, requestLineId);
                    }
                }

                $("#syncStatus").html("syncServiceRequestSKU... end");
            },
            error: function (e) {

            }
        });
    },

    syncServiceRequestLineCheckList: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestLineCheckList... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineCheckListData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId },
            success: function (result) {
                if (result.data != null) {
                    // //debugger;
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineCheckList(requestId, requestLineId, json1);

                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);

                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };

                                try {

                                    if (imgname.indexOf("/assets/images/dashboard/reports.png") > -1) {

                                        fileTransfer.download(
                                            uri1,
                                            filePath1,
                                            function (entry) {

                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                ////alert("hi");
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );

                                    } else {

                                        fileTransfer.download(
                                            uri,
                                            filePath,
                                            function (entry) {
                                                ////alert("hiii");
                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );
                                    }

                                }
                                catch (e) {

                                }


                            });
                        });
                    }
                    $("#syncStatus").html("syncServiceRequestLineCheckList... end");
                    $("#divTemp").html("");

                }
            },
            error: function (e) {
            }
        });
    },

    syncServiceRequestLineProductionStatus: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestLineProductionStatus... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineProductionPercentage',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId },
            success: function (result) {
                if (result.data != null) {
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineProductionStatus(requestId, requestLineId, json1);
                }
                $("#syncStatus").html("syncServiceRequestLineProductionStatus... end");
            },
            error: function (e) {

            }
        });
    },

    syncServiceRequestLineProductionComments: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestLineProductionStatus... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineComments',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId },
            success: function (result) {
                if (result.data != null) {
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineProductionComments(requestId, requestLineId, json1);
                }
                $("#syncStatus").html("syncServiceRequestLineProductionStatus... end");
            },
            error: function (e) {
            }
        });
    },

    syncServiceRequestLineUpload: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestLineUpload... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineUploadData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, typeId: 1 },
            success: function (result) {
                if (result.data != null) {
                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);

                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);
                                ////alert(filePath);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };


                                try {
                                    if (imgname.indexOf("/assets/images/dashboard/reports.png") > -1) {

                                        fileTransfer.download(
                                            uri1,
                                            filePath1,
                                            function (entry) {

                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                ////alert("hi");
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );

                                    } else {

                                        fileTransfer.download(
                                            uri,
                                            filePath,
                                            function (entry) {
                                                ////alert("hiii");
                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );
                                    }
                                } catch (e) {


                                }


                            });
                        });
                        $("#syncStatus").html("syncServiceRequestLineUpload... end");
                    }
                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineUpload(requestId, requestLineId, 1, json1);
                }
            },
            error: function (e) {
            }
        });
        $("#syncStatus").html("GetServiceRequestLineUploadData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineUploadData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, typeId: 2 },
            success: function (result) {
                if (result.data != null) {
                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);
                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };

                                try {
                                    if (imgname.indexOf("/assets/images/dashboard/reports.png") > -1) {

                                        fileTransfer.download(
                                            uri1,
                                            filePath1,
                                            function (entry) {

                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                ////alert("hi");
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );

                                    } else {

                                        fileTransfer.download(
                                            uri,
                                            filePath,
                                            function (entry) {
                                                ////alert("hiii");
                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );
                                    }

                                } catch (e) {


                                }


                            });
                        });
                        $("#syncStatus").html("GetServiceRequestLineUploadData... end");
                    }
                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineUpload(requestId, requestLineId, 2, json1);
                }
            },
            error: function (e) {
            }
        });
    },

    syncServiceRequestDefectHeader: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestDefectHeader... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineDefectListGroupHeader',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId },
            success: function (result) {
                //alert("syncServiceRequestDefectHeader " + result.data);
                if (result.data != null) {
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineDefectHeader(requestId, requestLineId, json1);
                    $("#syncStatus").html("syncServiceRequestDefectHeader... end");
                    //for (var i = 0; i < result.data.length; i++) {
                    //    var hval = result.data[i].Id;
                    //app.sync.syncServiceRequestDefectDetails(requestId, requestLineId, hval);
                    //    app.sync.syncServiceRequestDefectDetailsNew(requestId, requestLineId, hval);
                    //}
                }
            },
            error: function (e) {
                //alert("syncServiceRequestDefectHeader error");
            }
        });
    },

    syncServiceRequestDefectHeaderData: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestDefectHeaderData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestDetectListHeader',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId },
            success: function (result) {
                //alert("syncServiceRequestDefectHeaderData " + result.data);
                if (result.data != null) {
                    if (result.data != null) {
                        var json1 = "";
                        json1 = JSON.stringify(result.data);
                        json1 = replaceAll(json1, "'", "`");
                        app.InsertServiceRequestLineDefectHeaderData(requestId, requestLineId, json1);
                    }
                }
                $("#syncStatus").html("syncServiceRequestDefectHeaderData... end");
            },
            error: function (e) {
                //alert("syncServiceRequestDefectHeaderData error");
            }
        });
    },

    syncServiceRequestDefectFooderData: function (requestId, requestLineId) {
        $("#syncStatus").html("syncServiceRequestDefectFooderData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServicerequestLineDefectFooterData',
            async: false,
            dataType: "json",
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId },
            success: function (result) {
                //alert("syncServiceRequestDefectFooderData " + result.data);
                if (result.data != null) {
                    app.InsertServiceRequestLineDefectFooterData(requestId, requestLineId, result.data, result.data1, result.data2);
                    $("#syncStatus").html("sync completed successfully...");
                }
            },
            error: function (e) {
                //alert("syncServiceRequestDefectFooderData error");
            }
        });
    },

    syncServiceRequestDefectDetails: function (requestId, requestLineId, headerVal) {
        $("#syncStatus").html("syncServiceRequestDefectDetails... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineDefectListData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, businessObjectId: headerVal },
            success: function (result) {
                if (result.data != null) {
                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);

                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };


                                try {
                                    if (imgname.indexOf("/assets/images/dashboard/reports.png") > -1) {

                                        fileTransfer.download(
                                            uri1,
                                            filePath1,
                                            function (entry) {

                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                ////alert("hi");
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );

                                    } else {

                                        fileTransfer.download(
                                            uri,
                                            filePath,
                                            function (entry) {
                                                ////alert("hiii");
                                                console.log("download complete: " + entry.fullPath);
                                                // kendo.mobile.application.hideLoading();
                                                window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                            },
                                            function (error) {
                                                console.log("download error source " + error.source);
                                                console.log("download error target " + error.target);
                                                console.log("download error code" + error.code);
                                                //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                // kendo.mobile.application.hideLoading();
                                            },
                                            false,
                                            {

                                            }
                                        );
                                    }
                                } catch (e) {


                                }


                            });
                        });
                    }
                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineDefectDetails(requestId, requestLineId, headerVal, json1);
                }
                $("#syncStatus").html("syncServiceRequestDefectDetails... end");
            },
            error: function (e) {
            }
        });
    },

    syncServiceRequestDefectDetailsNew: function (requestId, requestLineId, headerVal) {
        $("#syncStatus").html("syncServiceRequestDefectDetailsNew... start");
        console.log(app.ServerUrl + '/QMSApp/GetServiceRequestLineDefectListDataFromSp ' + app.UserId + ' ' + app.CompanyId + ' ' + requestId + ' ' + requestLineId + ' ' + headerVal);

        //debugger;
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetServiceRequestLineDefectListDataFromSp',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, serviceRequestId: requestId, serviceRequestLineId: requestLineId, businessObjectId: headerVal },
            success: function (result) {
                console.log(app.ServerUrl + '/QMSApp/GetServiceRequestLineDefectListDataFromSp - ' + app.CompanyId + ' ' + requestId + ' ' + headerVal);
                if (result.data != null) {
                    //var json1 = "";
                    //json1 = JSON.stringify(result.data);
                    //json1 = replaceAll(json1, "'", "`");
                    //app.InsertServiceRequestLineDefectHeader(requestId, requestLineId, json1);

                    for (var i = 0; i < result.data.length; i++) {
                        var hval = result.data[i].Id;
                        // app.sync.syncServiceRequestDefectDetails(requestId, requestLineId, hval);

                        var image1 = result.data;

                        var a = image1[i].UploadContent;

                        if (a != null) {

                            $("#divTemp").append(image1[i].UploadContent);

                            $("#divTemp").find("a").each(function () {
                                var filename = $(this).attr("data-parameter");
                                var fileTransfer = new FileTransfer();
                                var uri1 = encodeURI(filename);
                                ////alert(uri);
                                var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                                ////alert(filePath1);
                                var imgtags = $(this).find("img");
                                $(this).find("img").each(function () {
                                    var imgname = $(this).attr("src");
                                    ////alert(imgname);
                                    var imgname1 = imgname.split("/");
                                    ////alert(imgname1);
                                    var img = imgname1[imgname1.length - 1];
                                    ////alert(img);

                                    var uri = encodeURI(imgname);
                                    ////alert(uri);
                                    var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                    fileTransfer.onprogress = function (progressEvent) {
                                        console.log(progressEvent.loaded / progressEvent.total);
                                        if (progressEvent.lengthComputable) {
                                        } else {
                                        }
                                    };


                                    try {
                                        if (imgname.indexOf("/assets/images/dashboard/reports.png") > -1) {

                                            fileTransfer.download(
                                                uri1,
                                                filePath1,
                                                function (entry) {

                                                    console.log("download complete: " + entry.fullPath);
                                                    // kendo.mobile.application.hideLoading();
                                                    window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                                },
                                                function (error) {
                                                    ////alert("hi");
                                                    console.log("download error source " + error.source);
                                                    console.log("download error target " + error.target);
                                                    console.log("download error code" + error.code);
                                                    //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                    // kendo.mobile.application.hideLoading();
                                                },
                                                false,
                                                {

                                                }
                                            );

                                        } else {

                                            fileTransfer.download(
                                                uri,
                                                filePath,
                                                function (entry) {
                                                    ////alert("hiii");
                                                    console.log("download complete: " + entry.fullPath);
                                                    // kendo.mobile.application.hideLoading();
                                                    window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                                },
                                                function (error) {
                                                    console.log("download error source " + error.source);
                                                    console.log("download error target " + error.target);
                                                    console.log("download error code" + error.code);
                                                    //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                                    // kendo.mobile.application.hideLoading();
                                                },
                                                false,
                                                {

                                                }
                                            );
                                        }
                                    } catch (e) {

                                        alert("Error syncServiceRequestDefectDetailsNew " + e);
                                    }

                                });
                            });
                        }
                    }

                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertServiceRequestLineDefectDetails(requestId, requestLineId, headerVal, json1);
                    app.InsertServiceRequestLineDefectHeaderContent(requestId, requestLineId, json1);
                }
                $("#syncStatus").html("syncServiceRequestDefectDetailsNew... end");
            },
            error: function (e) {
                console.log("error " + e);
            }
        });
    },

    syncFactoryRequest: function () {
        $("#syncStatus").html("syncFactoryRequest... start");
        var servicerequestnumber = "1";
        kendo.mobile.application.showLoading();
        app.ServiceRequest = new kendo.data.DataSource();
        $.ajax({
            url: app.ServerUrl + '/QMSApp/FindFactoryRequest',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, requestId: servicerequestnumber },
            success: function (result) {
                if (result.data != null) {
                    var d1 = JSON.parse(result.data);
                    for (var i = 0; i < d1.length; i++) {
                        var data = d1[i];
                        var id = data.Id;
                        var factoryrequestid = data.Code;
                        var factory = data.VendorId;
                        var factoryManager = data.FactoryManager;
                        var buyercompany = data.BuyerCompanyId;
                        var auditType = data.FactoryAuditTypeId;
                        var factorylocation = data.FactoryLocationId;
                        var allocationstartdate = "";
                        var allocationenddate = "";
                        var code = data.Code;
                        if (data.AllocatedAuditStartDate != null) {
                            try {
                                var d = eval(data.AllocatedAuditStartDate.replace(/\/Date\((\d+)\)\//gi, "new Date($1)"));
                                allocationstartdate = d.getDate() + "-" + (d.getMonth() + 1) + "-" + d.getFullYear();
                            } catch (e) {
                                allocationstartdate = "";
                            }
                        }
                        if (data.AllocatedAuditEndDate != null) {
                            try {
                                var d1 = eval(data.AllocatedAuditEndDate.replace(/\/Date\((\d+)\)\//gi, "new Date($1)"));
                                allocationenddate = d1.getDate() + "-" + (d1.getMonth() + 1) + "-" + d1.getFullYear();

                            } catch (e) {
                                allocationenddate = "";
                            }
                        }
                        app.InsertFactoryRequest(id, factoryrequestid, factory, factoryManager, buyercompany, auditType, factorylocation, allocationstartdate, allocationenddate, code);
                        app.sync.syncFactoryRequestAuditParamData(id);
                        app.sync.syncFactoryRequestAuditParamHeaderDropdownData(id);
                        app.sync.syncFactoryRequestGetAuditUploadData(id);
                        app.sync.syncFactoryRequestGetAuditProductionUploadData(id);
                    }
                    //setTimeout(function () { $(".km-loader").hide(); }, 5000);
                }
                else {
                    //setTimeout(function () { $(".km-loader").hide(); }, 5000);
                }
                //setTimeout(function () { $(".km-loader").hide(); }, 5000);
                $("#syncStatus").html("syncFactoryRequest... end");
            }

        });
    },
    syncFactoryRequestAuditParamData: function (id) {
        $("#syncStatus").html("syncFactoryRequestAuditParamData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/FactoryRequestAuditParamData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: id },
            success: function (result) {
                if (result.data != null) {
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    var json2 = "";
                    json2 = JSON.stringify(result.data1);
                    json2 = replaceAll(json2, "'", "`");
                    var json3 = "";
                    json3 = JSON.stringify(result.data2);
                    json3 = replaceAll(json3, "'", "`");
                    var json4 = "";
                    json4 = JSON.stringify(result.data3);
                    json4 = replaceAll(json4, "'", "`");
                    app.InsertFactoryRequestAuditParamData(id, json1, json2, json3, json4);
                }
                $("#syncStatus").html("syncFactoryRequestAuditParamData... end");
            },
            error: function (e) {
                kendo.mobile.application.hideLoading();
            }
        })
    },
    syncFactoryRequestAuditParamHeaderDropdownData: function (id) {
        $("#syncStatus").html("syncFactoryRequestAuditParamHeaderDropdownData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/FactoryRequestAuditParamHeader',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: id },
            success: function (result) {
                if (result.data != null) {
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertFactoryRequestAuditParamHeaderDropdownData(id, json1);

                    for (var i = 0; i < result.data.length; i++) {
                        var hval = result.data[i].Id;
                        app.sync.syncFactoryRequestAuditParamSubHeadeDropdownData(id, hval);
                    }
                }
                $("#syncStatus").html("syncFactoryRequestAuditParamHeaderDropdownData... end");
            },
            error: function (e) {
            }
        });
    },
    syncFactoryRequestAuditParamSubHeadeDropdownData: function (id, hval) {
        $("#syncStatus").html("syncFactoryRequestAuditParamSubHeadeDropdownData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/FactoryRequestAuditParamSubHeader',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: id, headerId: hval },
            success: function (result) {
                if (result.data != null) {

                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertFactoryRequestSubHeadeDropdownData(id, hval, json1);
                    for (var i = 0; i < result.data.length; i++) {
                        var hval1 = result.data[i].Id;
                        app.sync.syncFactoryRequestAuditParamList(id, hval, hval1);
                    }
                }
                $("#syncStatus").html("syncFactoryRequestAuditParamSubHeadeDropdownData... end");
            },
            error: function (e) {
            }
        });
    },
    syncFactoryRequestAuditParamList: function (id, hval, hval1) {
        $("#syncStatus").html("syncFactoryRequestAuditParamList... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/FactoryRequestAuditParamList',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: id, parentBusinessObjectId: hval, businessObjectId: hval1 },
            success: function (result) {
                if (result.data != null) {
                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);
                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };

                                fileTransfer.download(
                                    uri1,
                                    filePath1,
                                    function (entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        //kendo.mobile.application.hideLoading();
                                        window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                    },
                                    function (error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("download error code" + error.code);
                                        //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                        //kendo.mobile.application.hideLoading();
                                    },
                                    false,
                                    {

                                    }
                                );
                                fileTransfer.download(
                                    uri,
                                    filePath,
                                    function (entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        //kendo.mobile.application.hideLoading();
                                        window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                    },
                                    function (error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("download error code" + error.code);
                                        //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                        //kendo.mobile.application.hideLoading();
                                    },
                                    false,
                                    {

                                    }
                                );
                            });
                        });
                    }
                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertFactoryRequestAuditParamList(id, hval, hval1, json1);
                }
                //kendo.mobile.application.hideLoading();
                $("#syncStatus").html("syncFactoryRequestAuditParamList... end");
            },
            error: function (e) {
                //kendo.mobile.application.hideLoading();
            }
        });
    },
    syncFactoryRequestGetAuditUploadData: function (id) {
        $("#syncStatus").html("syncFactoryRequestGetAuditUploadData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetAuditUploadData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: id, typeId: 6 },
            success: function (result) {
                if (result.data != null) {
                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);
                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };

                                fileTransfer.download(
                                    uri1,
                                    filePath1,
                                    function (entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        //kendo.mobile.application.hideLoading();
                                        window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                    },
                                    function (error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("download error code" + error.code);
                                        //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                        //kendo.mobile.application.hideLoading();
                                    },
                                    false,
                                    {

                                    }
                                );
                                fileTransfer.download(
                                    uri,
                                    filePath,
                                    function (entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        //kendo.mobile.application.hideLoading();
                                        window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                    },
                                    function (error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("download error code" + error.code);
                                        //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                        //kendo.mobile.application.hideLoading();
                                    },
                                    false,
                                    {

                                    }
                                );
                            });
                        });
                    }
                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertFactoryRequestGetAuditUploadData(id, 6, json1);
                }
                $("#syncStatus").html("syncFactoryRequestGetAuditUploadData... end");
            },
            error: function (e) {
                //kendo.mobile.application.hideLoading();
            }
        });
    },
    syncFactoryRequestGetAuditProductionUploadData: function (id) {
        $("#syncStatus").html("syncFactoryRequestGetAuditProductionUploadData... start");
        $.ajax({
            url: app.ServerUrl + '/QMSApp/GetAuditProductionUploadData',
            dataType: "json",
            timeout: 30000,
            async: false,
            data: { userId: app.UserId, companyId: app.CompanyId, factoryRequestId: id, typeId: 7 },
            success: function (result) {
                if (result.data != null) {
                    var image1 = result.data;

                    for (var i = 0; i < result.data.length; i++) {
                        var a = image1[i].UploadContent;

                        $("#divTemp").append(image1[i].UploadContent);

                        $("#divTemp").find("a").each(function () {
                            var filename = $(this).attr("data-parameter");
                            var fileTransfer = new FileTransfer();
                            var uri1 = encodeURI(filename);
                            ////alert(uri);
                            var filePath1 = app.DocumentDirectory + filename.substr(filename.lastIndexOf('/') + 1);
                            ////alert(filePath1);
                            var imgtags = $(this).find("img");
                            $(this).find("img").each(function () {
                                var imgname = $(this).attr("src");
                                ////alert(imgname);
                                var imgname1 = imgname.split("/");
                                ////alert(imgname1);
                                var img = imgname1[imgname1.length - 1];
                                ////alert(img);

                                var uri = encodeURI(imgname);
                                ////alert(uri);
                                var filePath = app.DocumentDirectory + imgname.substr(imgname.lastIndexOf('/') + 1);

                                fileTransfer.onprogress = function (progressEvent) {
                                    console.log(progressEvent.loaded / progressEvent.total);
                                    if (progressEvent.lengthComputable) {
                                    } else {
                                    }
                                };

                                fileTransfer.download(
                                    uri1,
                                    filePath1,
                                    function (entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        //kendo.mobile.application.hideLoading();
                                        window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                    },
                                    function (error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("download error code" + error.code);
                                        //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                        //kendo.mobile.application.hideLoading();
                                    },
                                    false,
                                    {

                                    }
                                );
                                fileTransfer.download(
                                    uri,
                                    filePath,
                                    function (entry) {
                                        console.log("download complete: " + entry.fullPath);
                                        //kendo.mobile.application.hideLoading();
                                        window.plugins.toast.showLongTop('Downloaded Sucessfully.', null, null);
                                    },
                                    function (error) {
                                        console.log("download error source " + error.source);
                                        console.log("download error target " + error.target);
                                        console.log("download error code" + error.code);
                                        //window.plugins.toast.showLongTop('Download Error. Error Code: ' + error.code, null, null);
                                        //kendo.mobile.application.hideLoading();
                                    },
                                    false,
                                    {

                                    }
                                );
                            });
                        });
                    }
                    $("#divTemp").html("");
                    var json1 = "";
                    json1 = JSON.stringify(result.data);
                    json1 = replaceAll(json1, "'", "`");
                    app.InsertFactoryRequestGetAuditProductionUploadData(id, 7, json1);
                }
                $("#syncStatus").html("syncFactoryRequestGetAuditProductionUploadData... end");
            },
            error: function (e) {
                //kendo.mobile.application.hideLoading();
            }
        });
    },
    afterShow: function () {

    },
});

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

function escapeRegExp(str) {
    return str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}


function ononline(e) {
    var value = $("#txtCheckList_Checked1").is(":checked");
    ////alert(value);
    if (value == true) {
        $("#txtCheckList_Checked1").prop("checked", true);
        //$("#txtCheckList_Checked2").prop("checked", false);
        localStorage.setItem("IsOnline", true);
        app.IsOnline = true;
        $(".homeIsonline").css("color", "green");
        $(".homeIsonline").html("Online");
        ////alert(app.IsOnline);
    }
    else {
        localStorage.setItem("IsOnline", false);
        app.IsOnline = false;
        $(".homeIsonline").css("color", "red");
        $(".homeIsonline").html("Offline");

    }
}

var isRunning = false;

function syncDBRecentnew() {
    // //alert('s')
    if (!isRunning) {
        isRunning = true;
        // //alert('test //alert1');
        $("#txtCheckList_Checked1").focus();

        app.sync.syncDBRecent();
    }
}

function syncDBnew() {
    if (!isRunning) {
        isRunning = true;
        // //alert('test //alert2');
        $("#txtCheckList_Checked1").focus();
        app.sync.syncDB();
    }
}

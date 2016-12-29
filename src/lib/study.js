var examLang = {
    'zh-cn': {
        'lang': "/zh-CN",
        'Subjective': "主观题",
        'Single': "单选题",
        'Multiple': "多选题",
        'Truefalse': "判断题",
        'Fillblanks': "填空题",
        'Multimedia': "多媒体",
        'Synthesis': "综合题",
        'confirm': "确认",
        'ShowAll': "显示全部",
        'Tips': "提示",
        'SubmitSure': "确定提交吗？",
        'Conclusion': "考试结束，已自动交卷！",
        'StillHave': "您还有{0}题没有做，确定提交吗？",
        'HaveOpen': "您已打开一个附件浏览！",
        'BeforeEntering': "在进入考试前，请仔细阅读考前须知！",
        'HaveRead': "我已阅读，进入考试",
        'ReturnView': "返回查看考前须知",
        'FiveMinutes': "离考试结束，还有5分钟！",
        'LeavingCount': "离开考试页面{0}次！",
        'LeavingSubmit': "对不起，你已{0}次离开考试页面，系统将为你自动交卷！"
    },
    'en-us': {
        'lang': "/en-US",
        'Subjective': "Subjective",
        'Single': "Single",
        'Multiple': "Multiple",
        'Truefalse': "True-false",
        'Fillblanks': "Fill-blanks",
        'Multimedia': "Multimedia",
        'confirm': "confirm",
        'ShowAll': "ShowAll",
        'Tips': "Tips",
        'SubmitSure': "Are you sure to submit?",
        'Conclusion': "The examination has ended, and been submited automaticly.",
        'StillHave': "You have {0} unanswered questions. Are you sure to submit?",
        'HaveOpen': "One attachment has been opened.",
        'BeforeEntering': "Please read the suggested readings carefully.",
        'HaveRead': "Already read, enter now",
        'ReturnView': "Return to the suggested readings",
        'FiveMinutes': "Only 5 mins left.",
        'LeavingCount': "Leaving the test page {0}!",
        'LeavingSubmit': "Sorry, you have to leave the test page {0} times, the system will automatically for you in!"
    }
};

var examCurrentLanguage = examLang[window.currentLang] || examLang["zh-cn"];

var timeGoInInterval;
var timeExamInterval;

//考试
var Exam = {};
Exam.urlPrefix = examCurrentLanguage.lang + "/Exam/";

Exam.SingleNoBackQID = ''; //单题不可逆已做题目的ID，如：1,2,3……

///////字段
Exam.autoSaveAnswerTimer = 0;
//5分钟自动保存计时
Exam.timeGoInToTicker = 0;
//进入考试倒计时
Exam.timeExamTicker = 0;
//考试倒计时
Exam.currentQuestionIndex = 1;
//当前显示的第几题
Exam.IsToTest = 0; //0：否；1：是
//学员是否进入考试
Exam.PageCloseIsSubmit = 1; //0：否；1：是
//页面关闭时，是否提交用户数据

//////属性
Exam.Examination = null;
//考试基本信息
Exam.ExampaperShow = null;
//试卷信息
Exam.UserAnswer = null;
//学员答案
Exam.AnswerResult = new Array();
//学员回答的结果
Exam.StatusSelect = 0;
//学员当前选择的状态


//////作弊
Exam.IsUseCheat = 1; //是否启用作弊
Exam.AllowCheatCount = 3; //允许作弊次数
Exam.CheatCount = 0; //作弊次数

Exam.SourseType = 0; //考试来源；0：考试；1：课程中的练习

var CurrentQuestionId = 0;

Exam.childAnswer = []; //保存综合题使用

//获取题型
Exam.GetQuestionType = function(type) {
    switch (type) {
        case examCurrentLanguage.Subjective:
            return 1;
        case examCurrentLanguage.Single:
            return 2;
        case examCurrentLanguage.Multiple:
            return 3;
        case examCurrentLanguage.Truefalse:
            return 4;
        case examCurrentLanguage.Fillblanks:
            return 5;
        case examCurrentLanguage.Multimedia:
            return 6;
        case examCurrentLanguage.Synthesis:
            return 7;
        default:
            return 0;
    }
};

//////方法
//单个显示
Exam.GetShowSingleQuestion = function(qId, order) {
    if (Exam.Examination.ExamShowWay == 0) {
        $(".singleQuestion").hide();
        $(".singleQuestion[id='q" + qId + "']").show();

        var questiontype = $("#order" + qId).parent().attr("type");

        $("#operation").find("a").removeClass("active");
        $("#operation").find("a[typeName=" + questiontype + "]").addClass("active");
    } else {
        Exam.GetShowQuestionList(3, 0, order);
    }
};

//获取要显示的试题信息（type：0:整卷显示；1：可逆；2：不可逆；3：整体和可逆  index: 上一题：-1;下一题：1； order：题序）
Exam.GetShowQuestionList = function(type, index, order) {
    if (type == 3)
        Exam.currentQuestionIndex = order;
    else
        Exam.currentQuestionIndex += index;
    if (type != 0 && (Exam.currentQuestionIndex < Exam.ExampaperShow.QuestionList.length || Exam.currentQuestionIndex > 1))
        $("#btnPreQuestion,#btnNextQuestion").removeAttr("disabled");
    if (type != 0 && Exam.currentQuestionIndex == 1)
        $("#btnPreQuestion").attr("disabled", "disabled");
    if (type != 0 && Exam.currentQuestionIndex == Exam.ExampaperShow.QuestionList.length)
        $("#btnNextQuestion").attr("disabled", "disabled");

    $("#questionList").html("");
    for (var i = 0; i < Exam.ExampaperShow.QuestionList.length; i++) {
        var qu = Exam.ExampaperShow.QuestionList[i];
        if (type == 0 || (type != 0 && qu.QuestionOrder == Exam.currentQuestionIndex)) {
            $("#questionList").append($("#questionShowTemplate").render(qu));

            //如果是填空题生成输入框
            if (qu.QType == 5) {
                var count = qu.FillBlankCount;
                var arr = new Array();
                for (var j = 1; j <= count; j++) {
                    arr.push(j);
                }
                $("#q" + qu.QuestionID + " .questionAnswer").append($("#fillBlankTemplate").render(arr));
                $("#q" + qu.QuestionID + " .questionAnswer input").attr("questionID", qu.QuestionID).bind("change", function() {
                    Exam.UpdateUserAnswer($(this).attr("questionID"), 5);
                });
            }
            if (type == 2) {
                //如果不可逆，标记就不显示
                $("#q" + qu.QuestionID + " a[sign='sign']").hide();
            } else {
                //是否标志
                if ($("#order" + qu.QuestionID).attr("signflag") == '1')
                    $("#q" + qu.QuestionID + " a[sign='sign']").eq(0).removeClass('signf').addClass('signt');
            }
            //初始化学员答案
            for (var j = 0; j < Exam.AnswerResult.length; j++) {
                var temparr = Exam.AnswerResult[j].split('!!***!!');
                if (parseInt(temparr[0]) == qu.QuestionID) {
                    var an = temparr[1];
                    if (an.length > 0) {
                        var siq = $("#q" + qu.QuestionID);
                        switch (siq.attr("type")) {
                            case "1":
                                //问答
                                {
                                    siq.find("textarea").eq(0).val(an);
                                }
                                break;
                            case "2":
                                //单选
                            case "3":
                                //多选
                            case "4":
                                //判断
                                {
                                    siq.find("input").each(function() {
                                        if ((',' + an + ',').indexOf(',' + $(this).attr("order") + ',') >= 0) {
                                            $(this).attr("checked", true);

                                            //$(this).parent().addClass("active");
                                        }
                                    });
                                }
                                break;
                            case "5":
                                //填空
                                {
                                    var tfa = an.split('##**##');
                                    var c = 0;
                                    siq.find("input").each(function() {
                                        $(this).val(tfa.length > c ? tfa[c] : '');
                                        c++;
                                    });
                                }
                                break;
                            case "6":
                                //多媒体
                                {
                                    if (siq.find("textarea").length > 0) {
                                        siq.find("textarea").eq(0).val(an);
                                    } else {
                                        siq.find("input").each(function() {
                                            if ((',' + an + ',').indexOf(',' + $(this).attr("order") + ',') >= 0) {
                                                $(this).attr("checked", true);

                                                //$(this).parent().addClass("active");
                                            }
                                        });
                                    }
                                }
                                break;
                        }
                    }
                }
            }
            Exam.InitChildData();
        }
    }
};

//右侧试题状态按钮筛选
///type(0：全部；1：未完成；2：已完成；3：已标记)
Exam.QuestionStatusSelect = function(obj, type) {
    $(obj).parent().find("a").removeClass('On');
    $(obj).addClass('On');
    Exam.StatusSelect = type;
    Exam.QuestionStatusSelectChild();
};
//更新右侧题号
Exam.QuestionStatusSelectChild = function() {
    switch (Exam.StatusSelect) {
        case 0:
            $("#questionCountDetail .singlequ").show();
            break;
        case 1:
            $("#questionCountDetail .singlequ").hide();
            $("#questionCountDetail .singlequ[doflag='0']").show();
            break;
        case 2:
            $("#questionCountDetail .singlequ").hide();
            $("#questionCountDetail .singlequ[doflag='1']").show();
            break;
        case 3:
            $("#questionCountDetail .singlequ").hide();
            $("#questionCountDetail .singlequ[signflag='1']").show();
            break;
    }
};

//整体显示题型按钮筛选
///type(1：问答；2：单选；3多选；4：判断；5：填空；6：多媒体; 7:综合题)
Exam.QuestionTypeSelect = function(type, objType) {
    $(objType).parent().find("a").removeClass("active");
    $(objType).addClass("active");
    var t = Exam.GetQuestionType(type);
    if (t == 0) {
        $(".singleQuestion").show();
    } else {
        $(".singleQuestion").hide();
        $(".singleQuestion[type='" + t + "']").show();
    }
};

//更改右侧标志状态
//signflag(0:未标记；1：标记)
Exam.ChangeSign = function(qid, obj) {
    var issign = $(obj).attr("signflag") == '0' ? '1' : '0';
    if (issign == '1')
        $(obj).attr("signflag", issign).removeClass('signf').addClass('signt');
    else
        $(obj).attr("signflag", issign).removeClass('signt').addClass('signf');
    var qu = $("#questionCountDetail #order" + qid);
    if (issign == '1')
        qu.removeClass("done").removeClass("nodone").removeClass("nosign").addClass("sign").attr("signflag", "1");
    else {
        if (qu.attr("doflag") == '1')
            qu.removeClass("sign").removeClass("nodone").removeClass("nosign").addClass("done").attr("signflag", "0");
        else
            qu.removeClass("done").removeClass("sign").removeClass("nosign").addClass("nodone").attr("signflag", "0");
    }
    Exam.ChangeTotal("");
};

//更改右侧统计(answer:学员答案)
Exam.ChangeTotal = function(answer, qId) {
    if ($("#questionCountDetail").find("p").length > 0) {
        var done = $("#questionCountDetail div[doflag='1']").length;
        var nodone = $("#questionCountDetail div[doflag='0']").length;
        var sign = $("#questionCountDetail div[signflag='1']").length;
        $("#quOverTotal").html(done);
        $("#quNoTotal").html(nodone);
        $("#quSignTotal").html(sign);
    } else {
        if (answer != "" && answer.length > 0) {
            if (("," + Exam.SingleNoBackQID + ",").indexOf("," + answer + ",") < 0) {
                Exam.SingleNoBackQID += Exam.SingleNoBackQID == "" ? answer : ("," + answer);
            }
        } else {
            if (qId != undefined && qId != null && qId > 0) {
                if (("," + Exam.SingleNoBackQID + ",").indexOf("," + qId + ",") >= 0) {
                    Exam.SingleNoBackQID = ("," + Exam.SingleNoBackQID + ",").replace("," + qId + ",", ",");
                    if (Exam.SingleNoBackQID == ",")
                        Exam.SingleNoBackQID = "";
                    else {
                        Exam.SingleNoBackQID = Exam.SingleNoBackQID.substring(1, Exam.SingleNoBackQID.length - 2);
                    }
                }
            }
        }
        $("#quOverTotal").text(Exam.SingleNoBackQID.split(',').length);
    }

    Exam.QuestionStatusSelectChild();
};

//获取学员答案
Exam.GetUserAnswer = function() {
    var count = 0;
    var str = '';
    for (var i = 0; i < Exam.AnswerResult.length; i++) {
        if (Exam.AnswerResult[i].split('!!***!!')[1].length == 0) {
            count++;
        }
        str += str == "" ? Exam.AnswerResult[i] : ('**!!!**' + Exam.AnswerResult[i]);
    }
    $("#userAnswer").val(str);
    return count;
};

//汇总学员答案（qID:试题ID，type：试题类型）
Exam.UpdateUserAnswer = function(qId, type) {
    CurrentQuestionId = qId;
    //debugger;
    var an = '';
    switch (type) {
        case 1:
            //问答
            an = $("#q" + qId + " .questionAnswer textarea").eq(0).val();
            break;
        case 2:
            //单选
        case 3:
            //多选
        case 4:
            //判断
            {
                //$("#q" + qId + " p").removeClass("active");
                $("#q" + qId + " .questionAnswer input").each(function() {
                    if ($(this).attr("checked")) {
                        an += an == "" ? ($(this).attr("order")) : (',' + $(this).attr("order"));

                        //$(this).parent().addClass("active");
                    }
                });
            }
            break;
        case 5:
            //填空
            {
                var tiankongEmpty = true;
                $("#q" + qId + " .questionAnswer input").each(function() {
                    //an += an == "" ? ($(this).val()) : ('##**##' + $(this).val());
                    an += $(this).val() + '##**##';
                    if ($(this).val().length > 0) {
                        tiankongEmpty = false;
                    }
                });
                if (tiankongEmpty) {
                    an = "";
                } else {
                    an = an.substring(0, an.length - 6);
                }
            }
            break;
        case 6:
            //情景
            {
                if ($("#q" + qId + " .questionAnswer textarea").length > 0) {
                    an = $("#q" + qId + " .questionAnswer textarea").eq(0).val();
                } else {
                    //$("#q" + qId + " p").removeClass("active");

                    $("#q" + qId + " .questionAnswer input").each(function() {
                        if ($(this).attr("checked")) {
                            an += an == "" ? ($(this).attr("order")) : (',' + $(this).attr("order"));

                            //$(this).parent().addClass("active");
                        }
                    });
                }
            }
            break;
    }
    for (var i = 0; i < Exam.AnswerResult.length; i++) {
        if (('**!!!**' + Exam.AnswerResult[i]).indexOf('**!!!**' + qId + '!!***!!') == 0) {
            Exam.AnswerResult[i] = qId + '!!***!!' + an;
        }
    }
    var qu = $("#questionCountDetail #order" + qId).eq(0);
    if (an == '') {
        if (qu.attr("signflag") == '1')
            qu.removeClass("done").removeClass("nodone").removeClass("nosign").addClass("sign").attr("doflag", "0");
        else
            qu.removeClass("sign").removeClass("done").removeClass("nosign").addClass("nodone").attr("doflag", "0");
    } else {
        if (qu.attr("signflag") == '1')
            qu.removeClass("done").removeClass("nodone").removeClass("nosign").addClass("sign").attr("doflag", "1");
        else
            qu.removeClass("nodone").removeClass("sign").removeClass("nosign").addClass("done").attr("doflag", "1");
    }
    Exam.ChangeTotal(an == "" ? "" : ("" + qId + ""), qId);
};

//汇总学员答案（qID:试题ID，type：试题类型，isRadio：0是;1否，pObj：被选择的段落）
Exam.UpdateSelectUserAnswer = function(qId, type, isRadio, pObj) {
    if (isRadio == 0) {
        var radio = $(pObj).find("input").eq(0);
        $(radio).attr("checked", true);
    } else {
        var checkbox = $(pObj).find("input").eq(0);
        if ($(checkbox).attr("checked")) {
            $(checkbox).attr("checked", false);
        } else {
            $(checkbox).attr("checked", true);
        }
    }
    Exam.UpdateUserAnswer(qId, type);
};

//更新进入倒计时
Exam.GoInToTicker = function() {
    timeGoInInterval = setInterval("changeGoIoTime()", 1000);
};

//暂时保存用户数据
Exam.HoldSaveStudentAnswer = function() {
    var childAnswerStr = Exam.childAnswer.length == 0 ? "" : JSON.stringify(Exam.childAnswer);
    $("#childAnswerStr").val(childAnswerStr);
    $.post(Exam.urlPrefix + "/ExamTest/SubmitStudentAnswer?euid=" + $("#examUserID").val() + "&submitType=2&UserRemainingTime=" + Exam.timeExamTicker,
        $("#submitAnswerForm").formSerialize()
    );
};

//考试交卷
Exam.SubmitExam = function(str) {
    //  debugger;
    var childAnswerStr = Exam.childAnswer.length == 0 ? "" : JSON.stringify(Exam.childAnswer);
    $("#childAnswerStr").val(childAnswerStr);

    Exam.PageCloseIsSubmit = 0;
    var count = Exam.GetUserAnswer();
    if (str != undefined && str != "") {
        if (str == "cheat") {
            //作弊，直接交卷
            $.post(Exam.urlPrefix + "/ExamTest/SubmitStudentAnswer?euid=" + $("#examUserID").val() + "&submitType=2&pecent=" + Exam.Examination.PercentScore + "&passScore=" + Exam.Examination.PassScore + "&UserRemainingTime=" + Exam.timeExamTicker + "&LeavePageTimes=" + Exam.CheatCount, $("#submitAnswerForm").formSerialize(), function(data) {
                Exam.goNextUrl(data);
            });
        } else {
            //时间到提交
            showDialog(examCurrentLanguage.Conclusion, function() {
                $.post(Exam.urlPrefix + "/ExamTest/SubmitStudentAnswer?euid=" + $("#examUserID").val() + "&submitType=2&pecent=" + Exam.Examination.PercentScore + "&passScore=" + Exam.Examination.PassScore + "&UserRemainingTime=0&LeavePageTimes=" + Exam.CheatCount, $("#submitAnswerForm").formSerialize(), function(data) {
                    Exam.goNextUrl(data);
                });
            });
        }
    } else {
        //提前提交
        var submitTitle = examCurrentLanguage.SubmitSure;
        if (count > 0) {
            submitTitle = $.format(examCurrentLanguage.StillHave, count); //"您还有" + count + '题没有做，确定提交吗？';
        }
        $.dialog({
            title: examCurrentLanguage.confirm,
            content: submitTitle,
            ok: function() {
                $.post(Exam.urlPrefix + "/ExamTest/SubmitStudentAnswer?euid=" + $("#examUserID").val() + "&submitType=2&pecent=" + Exam.Examination.PercentScore + "&passScore=" + Exam.Examination.PassScore + "&UserRemainingTime=" + Exam.timeExamTicker + "&LeavePageTimes=" + Exam.CheatCount, $("#submitAnswerForm").formSerialize(), function(data) {
                    Exam.goNextUrl(data);
                });
            },
            lock: true,
            cancel: true,
            max: false,
            min: false,
            close: ccc
        });
    }
};



Exam.goNextUrl = function(data) {
    var nextUrl = Exam.urlPrefix + "/ExamTest/ExamTestEnd?SourceType=" + Exam.SourseType + "&euid=" + $("#examUserID").val();
    var identify = identifyApp();
    if (data.result == 1) {
        if (Exam.SourseType == 1 || Exam.SourseType == 3) {
            if (identify.indexOf('IE') >= 0) {
                var parentWin = window.dialogArguments;
                parentWin.openExamUrl(nextUrl);
                window.returnValue = "OK";
                clearInterval(timeExamInterval);
                window.close();
            } else {
                window.location.href = nextUrl;
            }
        } else {
            window.returnValue = "OK";
            if (identify == 'FF') {
                var parentWin = window.dialogArguments;
                parentWin.location.reload();
            }
            clearInterval(timeExamInterval);
            window.close();
        }
    } else {
        showDialog("<span style='color:Red;'>" + data.msg + "</span", function() {
            if (Exam.SourseType == 1 || Exam.SourseType == 3) {
                if (identify.indexOf('IE') >= 0) {
                    var parentWin = window.dialogArguments;
                    parentWin.openExamUrl(nextUrl);
                    window.returnValue = "OK";
                    clearInterval(timeExamInterval);
                    window.close();
                } else {
                    window.location.href = nextUrl;
                }
            } else {
                window.returnValue = "OK";
                if (identify == 'FF') {
                    var parentWin = window.dialogArguments;
                    parentWin.location.reload();
                }
                clearInterval(timeExamInterval);
                window.close();
            }
        });
    }
}

//开始考试并更新进入倒计时
Exam.StartExamTest = function() {
    $.getJSON(Exam.urlPrefix + '/ExamTest/JudgeCanExamTest?euID=' + $("#examUserID").val() + '&flag=1', function(data) {
        if (data.result == 1) {
            $("#examBaseInfor").remove();
            $("#examTestMain").show();
            //显示头部信息
            $("#examTest").html($("#examTopTemplate").render(Exam.Examination));
            $(".exam-title").scrollToFixed();
            $(".exam-tool").scrollToFixed({
                marginTop: 79
            });
            //开始计时
            //Exam.timeExamTicker = Exam.Examination.ExamLength * 60;
            if (Exam.Examination.ExamType === 0) {
                Exam.timeExamTicker = Exam.Examination.UserRemainingTime;
                clearInterval(timeExamInterval);
                timeExamInterval = setInterval("changeExamTime()", 1000);
            }

            //显示操作按钮
            if (Exam.Examination.ExamShowWay == 0) {
                var arr = [];
                arr.push(examCurrentLanguage.ShowAll);
                var tmp = Exam.ExampaperShow.QuestionTypeStrShow.split(',');
                $.each(tmp, function(idx, item) {
                    arr.push(item);
                });
                $("#operation").html($("#examOperationAllShowTemplate").render(arr));
                $("#questionCountDetail").html($("#questionCountDetailTemplate").render(Exam.ExampaperShow.QuestionTypeStrShow.split(',')));
            } else if (Exam.Examination.ExamShowWay == 1) {
                $("#operation").html($("#examOperationSingleBackTemplate").render(1));
                $("#questionCountDetail").html($("#questionCountDetailTemplate").render(Exam.ExampaperShow.QuestionTypeStrShow.split(',')));
            } else {
                $("#operation").html($("#examOperationSingleNoBackTemplate").render(1));
            }


            //显示右侧的按钮
            var count = 0;
            for (var i = 0; i < Exam.UserAnswer.length; i++) {
                if (Exam.UserAnswer[i].Answer != "") {
                    count++;
                    Exam.SingleNoBackQID += Exam.SingleNoBackQID == "" ? Exam.UserAnswer[i].Qid : ("," + Exam.UserAnswer[i].Qid);
                }
                Exam.AnswerResult.push(Exam.UserAnswer[i].Qid + '!!***!!' + Exam.UserAnswer[i].Answer);
            }
            var countTotal = {
                QuAllTotal: Exam.ExampaperShow.QuestionList.length,
                QuOverTotal: count,
                QuNoTotal: Exam.ExampaperShow.QuestionList.length - count,
                QuSignTotal: 0
            };
            $("#questionCountTotal").html($("#questionCountTotalTemplate").render(countTotal));

            //单题不可逆时，屏蔽右侧的一些东西
            if (Exam.Examination.ExamShowWay == 2) {
                $(".examTest_op center,#questionCountTotal table tbody tr:last").remove();
                $("#quOverTotal").text(Exam.SingleNoBackQID.length == 0 ? 0 : Exam.SingleNoBackQID.split(',').length);
                $("#questionCountTotal").find("i[class='done']").hide();
                $(".showlist").hide();
            }

            //加载右侧的试题分部（整体显示和单题可逆时存在）
            if (Exam.Examination.ExamShowWay == 0 || Exam.Examination.ExamShowWay == 1) {
                for (var i = 0; i < Exam.ExampaperShow.QuestionList.length; i++) {
                    switch (Exam.ExampaperShow.QuestionList[i].QType) {
                        case 1:
                            //问答题
                            $("div[type='" + examCurrentLanguage.Subjective + "']").eq(0).append($("#questionSingleShowTemplate").render(Exam.ExampaperShow.QuestionList[i]));
                            break;
                        case 2:
                            //单选题
                            $("div[type='" + examCurrentLanguage.Single + "']").eq(0).append($("#questionSingleShowTemplate").render(Exam.ExampaperShow.QuestionList[i]));
                            break;
                        case 3:
                            //多选题
                            $("div[type='" + examCurrentLanguage.Multiple + "']").eq(0).append($("#questionSingleShowTemplate").render(Exam.ExampaperShow.QuestionList[i]));
                            break;
                        case 4:
                            //判断题
                            $("div[type='" + examCurrentLanguage.Truefalse + "']").eq(0).append($("#questionSingleShowTemplate").render(Exam.ExampaperShow.QuestionList[i]));
                            break;
                        case 5:
                            //填空题
                            $("div[type='" + examCurrentLanguage.Fillblanks + "']").eq(0).append($("#questionSingleShowTemplate").render(Exam.ExampaperShow.QuestionList[i]));
                            break;
                        case 7:
                            //多媒体
                            $("div[type='综合题']").eq(0).append($("#questionSingleShowTemplate").render(Exam.ExampaperShow.QuestionList[i]));
                            break;
                    }
                }
            }
            //初始化试题
            Exam.GetShowQuestionList(Exam.Examination.ExamShowWay, 0);

            //初始化试题分值
            Exam.InitQuestionScore();


            Exam.InitChildData();

            Exam.IsToTest = 1;

            //考试时，才会有作弊
            if (Exam.SourseType == 0) {

                //作弊
                //Exam.IsUseCheat = 1;
                ccc();
                //Exam.CheatCount = 0;
                setTimeout(function() {

                    if (navigator.userAgent.indexOf("MSIE 8.0") > 0) {
                        document.onfocusout = function(e) {
                            if (e === undefined) { //ie
                                var evt = event; //ie uses event
                                if (evt.toElement == null) { // where focus was lost to
                                    ad_blur();
                                }
                            }
                        };
                    } else {
                        $(window).blur(function() {
                            ad_blur(); //here is what you wanna do when blur fires
                        });
                    }
                }, 1000);
            }

        } else {
            showDialog(data.message);
        }
    });
};

//初始化试题分值
Exam.InitQuestionScore = function() {
    var str = '';
    var order = '';
    for (var i = 0; i < Exam.ExampaperShow.QuestionList.length; i++) {
        var qu = Exam.ExampaperShow.QuestionList[i];
        str += str == "" ? (qu.QuestionID + ',' + qu.Score) : (';' + qu.QuestionID + ',' + qu.Score);
        order += order == "" ? (qu.QuestionID + ',' + qu.QuestionOrder) : (';' + qu.QuestionID + ',' + qu.QuestionOrder);
    }
    $("#questionOrder").val(order);
    $("#questionScore").val(str);
};

var qqqid;
var browQuestionId = 0;
//试题附件显示
Exam.BrowQuestionFiles = function(qId) {
    qqqid = qId;
    if (browQuestionId > 0) {
        showDialog(examCurrentLanguage.HaveOpen);
        return;
    }
    browQuestionId = qId;
    for (var i = 0; i < Exam.ExampaperShow.QuestionList.length; i++) {
        if (Exam.ExampaperShow.QuestionList[i].QuestionID == qId) {
            var template = $("#questionFileTemplate").render(Exam.ExampaperShow.QuestionList[i]);
            //openPopWindow({ width: 350, height: 350, content: template });
            $.dialog({
                width: 350,
                height: 350,
                content: template,
                close: function() {
                    bbb();
                    browQuestionId = 0;
                }
            });
            player();
        }
    }

};

//更新进入倒计时
function changeGoIoTime() {
    Exam.timeGoInToTicker--;
    if (Exam.timeGoInToTicker > 0) {
        var str = '';
        var hour = parseInt(Exam.timeGoInToTicker / 3600);
        var minite = parseInt(Exam.timeGoInToTicker % 3600 / 60);
        var second = Exam.timeGoInToTicker % 3600 % 60;
        str = ((hour + "").length == 1 ? '0' + hour : hour) + ':' + ((minite + "").length == 1 ? '0' + minite : minite) + ':' + ((second + "").length == 1 ? '0' + second : second);
        $("#GoInTime").html(str);
        $("#divGoInTime").show();
    } else {
        $("#GoInTime").html('00:00:00');
        $("#divGoInTime").hide();
        $("#btnGoExam").removeAttr("disabled");
        $("#btnGoExam").removeClass("join-exam-gray").addClass("join-exam");
        $("#btnGoExam").click(function() {
            $.dialog({
                title: examCurrentLanguage.Tips,
                content: "<span style='font-size:large;'>" + examCurrentLanguage.BeforeEntering + "</span>",
                okVal: examCurrentLanguage.HaveRead,
                cancelVal: examCurrentLanguage.ReturnView,
                lock: true,
                ok: function() {
                    Exam.StartExamTest();
                },
                cancel: true,
                max: false,
                min: false,
                height: 100
            });
        });
        clearInterval(timeGoInInterval);
    }
};

//更新考试倒计时
function changeExamTime() {

    //自动保存答案
    Exam.autoSaveAnswerTimer++;
    if (Exam.autoSaveAnswerTimer == 300) {
        Exam.autoSaveAnswerTimer = 0;
        Exam.GetUserAnswer();
        Exam.HoldSaveStudentAnswer();
    }

    if (Exam.Examination.ExamType == 0) {
        //debugger;
        Exam.timeExamTicker--;
        if (Exam.timeExamTicker > 0) {
            if (Exam.timeExamTicker == 300) {
                showDialog(examCurrentLanguage.FiveMinutes, ccc);
            }
            var hour = parseInt(Exam.timeExamTicker / 3600);
            var minite = parseInt(Exam.timeExamTicker % 3600 / 60);
            var second = Exam.timeExamTicker % 3600 % 60;
            if (hour < 10) {
                hour = "0" + hour;
            }
            if (minite < 10) {
                minite = "0" + minite;
            }
            if (second < 10) {
                second = "0" + second;
            }

            var str = '<b>' + hour + '</b>:<b>' + minite + '</b>:<b>' + second + '</b>';
            $("#examlefttime").html(str);
        } else {
            clearInterval(timeExamInterval);
            Exam.SubmitExam('timeout');
        }
    }


};

function ccc() {
    Exam.IsUseCheat = 0;
    //$(".singleQuestion:visible [id^='answer_']").eq(0).focus();
    $("[id^='answer_" + CurrentQuestionId + "']").eq(0).focus();
    Exam.IsUseCheat = 1;
}

function ad_blur() {
    if (Exam.Examination.StartCheating == 0) {
        if (Exam.IsUseCheat == 1) {
            Exam.CheatCount++;
            if (Exam.CheatCount > Exam.AllowCheatCount) {
                var acc = Exam.AllowCheatCount;
                if (acc == 0) {
                    acc = 1;
                }
                //alert("对不起，你已" + acc + "次离开考试页面，系统将为你自动交卷！");
                alert($.format(examCurrentLanguage.LeavingSubmit, acc));
                Exam.SubmitExam('cheat');
            } else {
                //alert("离开考试页面" + Exam.CheatCount + "次！");
                //showDialog("离开考试页面" + Exam.CheatCount + "次！");
                showDialog($.format(examCurrentLanguage.LeavingCount, Exam.CheatCount));
            }
        }
    }
}

function bbb() {
    Exam.IsUseCheat = 0;
    $("[id^='answer_" + qqqid + "']").eq(0).focus();
    Exam.IsUseCheat = 1;
}

window.onbeforeunload = function() {
    if (navigator.userAgent.indexOf("Firefox") >= 0) {
        $(window).unbind('blur');
        window.parent.focus();
    } else if (navigator.userAgent.indexOf("Chrome") >= 0) {
        if ($.isFunction(opener.currentCallback)) {
            opener.currentCallback();
        }
    }
}

var childAnswer = [];
///存储综合题的答案
Exam.UpdateChildUserAnswer = function(qId, type, Allindex) {
    var chanswer = {};
    var i = 0;
    var flag = true;
    $.each(Exam.childAnswer, function(index, child) {
        if (child.qId == qId && child.Index == Allindex) {
            flag = false;
            i = index;
        }
    });

    //debugger;
    Exam.childAnswer[i].Index = Allindex;
    Exam.childAnswer[i].score = 0;
    var answer = GetChildAnswer(type, qId, Allindex);

    Exam.childAnswer[i].Asnwer = answer;

    var noZuo = 0;
    $.each(Exam.childAnswer, function(index, child) {
        if (child.qId == qId) {
            if (child.Asnwer == '') {
                noZuo++;
            }
        }
    });

    ///此处仅为了结合那验证还有几题未答的方法
    for (var i = 0; i < Exam.AnswerResult.length; i++) {
        if (('**!!!**' + Exam.AnswerResult[i]).indexOf('**!!!**' + qId + '!!***!!') == 0) {
            Exam.AnswerResult[i] = qId + '!!***!!' + (noZuo > 0 ? "" : "1");
        }
    }

    //debugger;
    var qu = $("#questionCountDetail #order" + qId).eq(0);
    if (noZuo > 0) {
        if (qu.attr("signflag") == '1')
            qu.removeClass("done").removeClass("nodone").removeClass("nosign").addClass("sign").attr("doflag", "0");
        else
            qu.removeClass("sign").removeClass("done").removeClass("nosign").addClass("nodone").attr("doflag", "0");
    } else {
        if (qu.attr("signflag") == '1')
            qu.removeClass("done").removeClass("nodone").removeClass("nosign").addClass("sign").attr("doflag", "1");
        else
            qu.removeClass("nodone").removeClass("sign").removeClass("nosign").addClass("done").attr("doflag", "1");
    }
    Exam.ChangeTotal(answer == "" ? "" : ("" + qId + ""), qId);


}

///返回综合题的答案
function GetChildAnswer(type, qId, allindex) {
    var answer = "";
    switch (type) {
        case 1: //问答
            answer = $("#q" + qId + " #ch_answer_" + qId + "_" + allindex).eq(0).val();
            break;
        case 2: //单选
        case 3: //多选
        case 4: //判断
            $("#q" + qId + " input[name='ch_answer_" + qId + "_" + allindex + "']:checked").each(function() {
                answer += answer == "" ? ($(this).attr("order")) : (',' + $(this).attr("order"));
            });
            break;
        case 5: //填空
            {
                //debugger;
                var tiankongEmpty = true;
                $("#q" + qId + " input[name='ch_answer_" + qId + "_" + allindex + "']").each(function() {
                    answer += $(this).val() + '##**##';
                    if ($(this).val().length > 0) {
                        tiankongEmpty = false;
                    }
                });
                if (tiankongEmpty) {
                    answer = "";
                } else {
                    answer = answer.substring(0, answer.length - 6);
                }
            }
            break;
    }
    return answer;
}

///初始化综合题的答案
Exam.InitChildData = function() {

    $("div[type=7]").each(function() {
        //debugger;
        var qId = $(this).attr("id").replace("q", "");
        $.each($(this).find(".questionAnswer div[id^='ch_']"), function() {
            var type = parseInt($(this).attr("qType"));
            var index = $(this).attr("index");
            var chanswer = {};
            chanswer.qId = qId;
            chanswer.Index = index;
            chanswer.score = 0;
            chanswer.Asnwer = GetChildAnswer(type, qId, index);
            //Exam.childAnswer.push(chanswer);
            mergeAnswer(Exam.childAnswer, chanswer)
            index++;
        });

    });
}

function mergeAnswer(arr, addkey) {
    var isfind = false;
    for (var i = 0; i < arr.length; i++) {
        if (arr[i].qId == addkey.qId && arr[i].Index == addkey.Index) isfind = true;
    }
    if (!isfind) {
        arr.push(addkey);
    }
}

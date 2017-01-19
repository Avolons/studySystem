// GetUserExamAnswer 获取用户答案
// SubmitAnswer 提交答案（userExamId，考试id为参数）
// GetExamInfoHaveAnswer 获得试卷详细信息
// GetUserExamChart 获得详细信息上面的统计图
// StorageAnswer 缓存答案（userExamId，考试id为参数）
// GetExamPreview 考试预览信息
//AddDepartureTimes 新增离开页面次数，（userExamId，考试id为参数）、、、、
//GetExamPreview 考试预览页面
var App = new Vue({
    el: "#vue-container",
    data: function() {
        return {
            tindex: ["A", "B", "C", "D", "E", "F", "H"],
            //显示全部按钮
            ShowAll: true,
            //右侧试题属性计算数组
            rightType: [{
                text: "全部",
                val: 0,
                isshow: true,
            }, {
                text: "已完成",
                val: 0,
                isshow: false,
            }, {
                text: "未完成",
                val: 0,
                isshow: false,
            }, {
                text: "已标记",
                val: 0,
                isshow: false,
            }, ],
            qstData: {}, //试卷内容对象
            answerList: [], //答案对象
            nowTime: "00:00:00", //剩余时间
            numbertime: null, //真实时间
            timer: null, //当前的定时器
            wrongTime: 0, //当前网络的错误次数
            showIndex: 0, //当前显示的题目index值
        };
    },
    //方法逻辑判断区域
    methods: {
        //******题目类型过滤显示
        typeSel: function(item) {
            //******题目类型显示全部
            for (var j = 0; j < this.qstData.QuestionsTypes.length; j++) {
                this.qstData.QuestionsTypes[j].isshow = false;
            }
            //******类型选项为点击全部的时候
            if (item === "All") {
                this.ShowAll = true;
                for (var i = 0; i < this.qstData.QuestionsItems.length; i++) {
                    this.qstData.QuestionsItems[i].isshow = false;
                }
            } else {
                this.ShowAll = false;
                for (var k = 0; k < this.qstData.QuestionsItems.length; k++) {
                    if (this.qstData.QuestionsItems[k].Type.toString() === item.Value) {
                        this.qstData.QuestionsItems[k].isshow = false;
                    } else {
                        this.qstData.QuestionsItems[k].isshow = true;
                    }
                }
                item.isshow = true;
            }
            //触发视图更新
            var data = this.qstData;
            this.qstData = null;
            this.qstData = data;
        },
        //******是否对题目进行了标记
        signtoggle: function(item) {
            //同时要对右侧视图进行更新
            if (item.issign) {
                item.issign = false;
                this.rightType[3].val--;
            } else {
                item.issign = true;
                this.rightType[3].val++;
            }
            //触发视图更新
            var data = this.qstData;
            this.qstData = null;
            this.qstData = data;
        },
        //******题目状态过滤显示0,全部，1已完成，2未完成，3标记
        stateSel: function(item, index) {
            //状态栏的操作，被选中状态
            for (var i = 0; i < this.rightType.length; i++) {
                this.rightType[i].isshow = false;
            }
            item.isshow = true;

        },
        //******点击上一题，下一题
        getNewQest: function(direction) {
            //direction为true，为下一题
            if (direction) {

            } else {

            }
        },
        //******点击显示对应题目
        rightcheck: function(index, type) {
            //******首先对题目的显示进行操作
            for (var j = 0; j < this.qstData.QuestionsItems.length; j++) {
                if (j === index) {
                    this.qstData.QuestionsItems[j].isshow = false;
                } else {
                    this.qstData.QuestionsItems[j].isshow = true;
                }
            }
            //******对类型栏的显示进行操作
            for (var k = 0; k < this.qstData.QuestionsTypes.length; k++) {
                if (this.qstData.QuestionsTypes[k].Value === type.toString()) {
                    this.qstData.QuestionsTypes[k].isshow = true;
                } else {
                    this.qstData.QuestionsTypes[k].isshow = false;
                }
            }
            this.ShowAll = false;
            //触发视图更新
            var data = this.qstData;
            this.qstData = null;
            this.qstData = data;
        },
        //******答案变化处理函数，判断当前题目是否完成,答案对象，类型，题目对象
        answerchange: function(item, ite) {
            switch (ite.Type) {
                //******题型为多选题时
                case 3:
                    if (item.AnswerText[0]) {
                        ite.isfinish = true;
                    } else {
                        ite.isfinish = false;
                    }
                    break;
                    //******题型为综合题时,循环检测当前题目答案是否全部完成
                case 7:
                    if (!ite.isfinish) {
                        ite.isfinish = true;
                    }
                    for (var i = 0; i < item.GroupAnswers.length; i++) {
                        if (ite.GroupItem[i].Type === 3) {
                            if (!item.GroupAnswers[i].AnswerText[0]) {
                                ite.isfinish = false;
                                return false;
                            }
                        } else {
                            if (!item.GroupAnswers[i].AnswerText) {
                                ite.isfinish = false;
                                return false;
                            }
                        }
                    }
                    break;
                    //******其余题型
                default:
                    if (item.AnswerText) {
                        ite.isfinish = true;
                    } else {
                        ite.isfinish = false;
                    }
            }
            //******对数目进行校验
            App.rightType[2].val = 0;
            App.rightType[1].val = 0;
            for (var k = 0; k < this.qstData.QuestionsItems.length; k++) {
                if (this.qstData.QuestionsItems[k].isfinish) {
                    App.rightType[1].val++;
                } else {
                    App.rightType[2].val++;
                }
            }
        },
        //*******答案的预先格式化
        answerformatting: function(arrys) {
            for (var i = 0; i < arrys.length; i++) {
                switch (arrys[i].Type) {
                    //格式为综合题时需要二次拼装
                    case 7:
                        var data = {
                            Id: arrys[i].Id,
                            Type: 7,
                            AnswerText: null,
                            GroupAnswers: []
                        };
                        for (var k = 0; k < arrys[i].GroupItem.length; k++) {
                            //多选题的答案结构必须是数组
                            if (arrys[i].GroupItem[k].Type === 3) {
                                data.GroupAnswers.push({
                                    Id: arrys[i].GroupItem[k].Id,
                                    Type: arrys[i].GroupItem[k].Type,
                                    AnswerText: [],
                                    GroupAnswers: null
                                });
                            } else {
                                data.GroupAnswers.push({
                                    Id: arrys[i].GroupItem[k].Id,
                                    Type: arrys[i].GroupItem[k].Type,
                                    AnswerText: null,
                                    GroupAnswers: null
                                });
                            }
                        }
                        this.answerList.push(data);
                        break;
                    case 3:
                        this.answerList.push({
                            Id: arrys[i].Id,
                            Type: arrys[i].Type,
                            AnswerText: [],
                            GroupAnswers: null
                        });
                        break;
                    default:
                        this.answerList.push({
                            Id: arrys[i].Id,
                            Type: arrys[i].Type,
                            AnswerText: null,
                            GroupAnswers: null
                        });
                }
            }
        },
        //******倒计时显示函数
        timeover: function() {
            //******获取当前的时间
            this.timer = setInterval(function() {
                var countDown = App.numbertime;
                //获取小时数
                var oHours = parseInt(countDown / (60 * 60) % 24);
                if (oHours < 10) {
                    oHours = "0" + oHours;
                }
                //获取分钟数
                var oMinutes = parseInt(countDown / 60 % 60);
                if (oMinutes < 10) {
                    oMinutes = "0" + oMinutes;
                }
                //获取秒数
                var oSeconds = parseInt(countDown % 60);
                if (oSeconds < 10) {
                    oSeconds = "0" + oSeconds;
                }
                App.nowTime = oHours + ":" + oMinutes + ":" + oSeconds;
                App.numbertime--;
                //到达最终时间时，直接提交试卷
                if (App.numbertime === 0) {
                    clearInterval(App.timer);
                }
            }, 1000);

        },
        //******以下都是对答案的处理函数
        //******发送答案，绑定提交试卷
        sendanswer: function(url) {
            url = url || "http://192.168.1.5/home/SubmitAnswer";
            //进行最终的答案结构一体化
            var arrobj = JSON.parse(JSON.stringify(this.answerList));
            for (var i = 0; i < arrobj.length; i++) {
                //多选题的数组对象要改成字符串对象
                if (arrobj[i].Type === 3) {
                    arrobj[i].AnswerText = arrobj[i].AnswerText.join(",");
                }
                if (arrobj[i].Type === 7) {
                    var groupobj = arrobj[i].GroupAnswers;
                    for (var j = 0; j < groupobj.length; j++) {
                        if (groupobj[j].Type === 3) {
                            groupobj[j].AnswerText = groupobj[j].AnswerText.join(",");
                        }
                    }
                }
            }
            //进行最终的答案发送
            arrobj = JSON.stringify(arrobj);
            // $.post(url, {
            //     body: arrobj,
            // }, function() {
            //
            // });
            this.$http.post(url,{body: arrobj}).then((response) => {

            }, (error) => {

            });
        },
        //******定时保存答案,五分钟一次
        saveanswer: function() {
            var url = "http://192.168.1.5/home/StorageAnswer";
            setInterval(function() {
                //缓存答案;
                App.sendanswer(url);
                // console.log(App.answerList);
                //发送
            }, 3e4);
        },
        //******取回答案的预先格式化
        getOldanswer: function(arrobj) {
            for (var i = 0; i < arrobj.length; i++) {
                //多选题的数组对象要改成字符串对象
                if (arrobj[i].Type === 3) {
                    arrobj[i].AnswerText = arrobj[i].AnswerText.split(",");
                }
                if (arrobj[i].Type === 7) {
                    var groupobj = arrobj[i].GroupAnswers;
                    for (var j = 0; j < groupobj.length; j++) {
                        if (groupobj[j].Type === 3) {
                            groupobj[j].AnswerText = groupobj[j].AnswerText.split(",");
                        }
                    }
                }
            }
        }
    },
    mounted: function() {
        var index = layer.load(0);
        //最初的数据请求，最初情况分三种,1.基本类型 2.单题目可逆 3.单题目不可逆
        this.$http.get("http://127.0.0.1:8080/api/test").then((data) => {
            //单题目可逆和单题目不可逆,0:正常题目，1：单题可逆，2：单题不可逆
            if (data.body.ShowQustionType !== 0) {
                //单题可逆
                if (data.body.ShowQustionType === 1) {
                    //判断当前题库是否处于初次打开状态
                    if (data.body.IsFirstAnswer) {
                      //答案对象初始化
                      this.answerformatting(data.body.QuestionsItems);
                      //题目初始化
                      this.qstData = data.body;
                    } else {

                    }
                } else {
                    //判断当前题库是否处于初次打开状态
                    if (data.body.IsFirstAnswer) {
                      //答案对象初始化
                      this.answerformatting(data.body.QuestionsItems);
                      //题目初始化
                      this.qstData = data.body;
                    } else {

                    }
                }
                this.rightType[0].val = data.body.QuestionsItems.length;
                this.rightType[2].val = data.body.QuestionsItems.length;
                this.numbertime = data.body.ExamLength * 60;
                this.timeover();
            } else {
                //正常答题情况下
                if (data.body.IsFirstAnswer) {
                    //答案对象初始化
                    this.answerformatting(data.body.QuestionsItems);
                    //题目初始化
                    this.qstData = data.body;
                    this.rightType[0].val = data.body.QuestionsItems.length;
                    this.rightType[2].val = data.body.QuestionsItems.length;
                    this.numbertime = data.body.ExamLength * 60;
                    this.timeover();
                    this.sendanswer("http://192.168.1.5/home/StorageAnswer");
                    this.saveanswer();
                    layer.close(index);
                } else {
                    this.$http.get("http://192.168.1.5/home/GetUserExamAnswer").then((result) => {
                        this.qstData = data.body;
                        this.answerList = this.getOldanswer(result.body);
                        //数目统计初始化
                        this.rightType[0].val = data.body.QuestionsItems.length;
                        this.rightType[2].val = data.body.QuestionsItems.length;
                        this.numbertime = data.body.ExamLength * 60;
                        this.timeover();
                        this.saveanswer();
                        layer.close(index);
                    }, (error) => {

                    });
                }
            }
        }, (error) => {});
    }
});

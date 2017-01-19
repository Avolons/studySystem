// GetUserExamAnswer 获取用户答案
// SubmitAnswer 提交答案
// GetExamInfoHaveAnswer 获得试卷详细信息
// GetUserExamChart 获得详细信息上面的统计图
// StorageAnswer 缓存答案
// GetExamPreview 考试预览信息
var App = new Vue({
    el: "#vue-container",
    data: function() {
        return {
            tindex: ["A", "B", "C", "D", "E", "F", "H"],
            //显示全部按钮
            ShowAll: true,
            qstData: {}, //试卷内容对象
            scoreList:[],//分数列表对象
            //是否显示顶部过滤
            topSelect:false,
        };
    },
    //方法逻辑判断区域
    methods: {
        //******答案格式化
        listFormatting:function(arrys){
          for (var i = 0; i < arrys.length; i++) {
              switch (arrys[i].Type) {
                  //格式为综合题时需要二次遍历
                  case 7:
                      for (var k = 0; k < arrys[i].GroupItem.length; k++) {
                          //多选题的答案结构必须是数组
                          var type=arrys[i].GroupItem[k].Type;
                          if (type === 3) {
                            var carray=arrys[i].GroupItem[k].Answer.split(",");
                            for(var m=0;m<carray.length;m++){
                              carray[m]=this.tindex[carray[m]];
                            }
                            arrys[i].GroupItem[k].Answer=carray.join(",");
                          }else if (type === 2||type === 4) {
                            arrys[i].GroupItem[k].Answer=this.tindex[arrys[i].GroupItem[k].Answer];
                          } else{

                          }
                      }
                      break;
                      //多选题时
                  case 3:
                  var newarray=arrys[i].Answer.split(",");
                  for(var j=0;j<newarray.length;j++){
                    newarray[j]=this.tindex[newarray[j]];
                  }
                  arrys[i].Answer=newarray.join(",");
                  break;
                  //单选和判断
                  case 2||4:
                  arrys[i].Answer=this.tindex[arrys[i].Answer];
                  break;
                  //其他类型的题目
                  default:
              }
          }
        },
        //******是否显示顶部的选择
        topSel:function(){
          $(window).scroll(function(){
            if($(this).scrollTop()>=597){
              App.topSelect=true;
            }else{
              App.topSelect=false;
            }
          });
        },
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
    },
    mounted: function() {
        var index = layer.load(0);
        //模拟的假数据
        this.$http.get("http://192.168.1.5/home/GetUserExamChart").then((data) => {
            this.scoreList = data.body;
            this.topSel();
            this.$http.get("http://192.168.1.5/home/GetExamInfoHaveAnswer").then((data) => {
                this.qstData = data.body;
                this.listFormatting(this.qstData.QuestionsItems);
                layer.close(index);
            }, (error) => {});
        }, (error) => {});
    }
});

import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'html',
})
export class HtmlPipe implements PipeTransform {
  transform(str: string): string {
    str = str || "";
    let text = "";
    if(str!=""){
      text = this.replaceSrc(str)
    }
    return text;
  }

  replaceSrc(txt: string) {

    //url 高亮
    let reg=/(http|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:/~\+#]*[\w\-\@?^=%&amp;/~\+#])?/g;
    let result = txt.replace(reg, function(item) {
      return "<span class='httpSpan'>" + item + '</span>';
    });

    //# 高亮
    let reg1 = /#(.+?)(?=[-\s.,:,｜，]|$)/g;
    result = result.replace(reg1, function(item) {
      let count = item.split('#').length - 1;
      if(count === 1){
       let re = /[a-zA-Z]/;//是否包含英文
       let re1 =  /([\u4e00-\u9fa5]|[\ufe30-\uffa0])/; //是否包含中文
       if(item.match(re) == null && item.match(re1) == null){
           return item;
       }
       return "<span class='httpSpan'>" + item + '</span>';
      }
      return item;
    });

     //$高亮
     let reg2 = /[$](.+?)(?=[\s]|$)/g;
     result = result.replace(reg2, function(item) {
       let count = item.split('$').length - 1;
       if(count === 1){
        let re = /^[A-Za-z$]*$/;//必须是英文字母
        if(item.match(re) == null){
            return item;
        }
        return "<span class='httpSpan'>" + item + '</span>';
       }
       return item;
     });
    return result;

  }
}

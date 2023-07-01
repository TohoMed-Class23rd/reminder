function remind() {
  const sheets = SpreadsheetApp.openById(PropertiesService.getScriptProperties().getProperty("ReminderSpreadSheetID"));
  const upNextSheet = sheets.getSheetByName("UpNext");
  const archiveSheet = sheets.getSheetByName("Archive");
  upNextSheet.getRange(2,1,upNextSheet.getLastRow()).setNumberFormat("yyyy/MM/dd HH:mm");
  upNextSheet.getRange(2,1,upNextSheet.getLastRow(),upNextSheet.getLastColumn()).sort({column: 1, ascending: true});
  let now = new Date();
  var content = '\n';

  for (let i = 2; i <= Math.min(upNextSheet.getLastRow(), 11); i++){
    let values = upNextSheet.getRange(i,1,1,3).getValues()[0];
    let date = new Date(values[0]);
    if (now < date){
      // 未来
      if (values[1] == '期限'){
        content += `・${values[2]} ${dateToString()}まで`;
      } else if(values[1] == 'イベント'){
        content += `・${dateToString()}、${values[2]}`;
      };
      if (i != upNextSheet.getLastRow()){
        content += '\n'
      }

      function dateToString(){
        function relativeDate(input){
          let today = new Date(now);
          today.setHours(0,0,0,0);
          let convertedInput = new Date(input);
          convertedInput.setHours(0,0,0,0);
          let delta = Math.floor((convertedInput - today)/86400000);
          switch (delta) {
            case 0:
              return '今日';
              break
            case 1:
              return '明日';
              break
            case 2:
              return '明後日';
              break
            default:
              return Utilities.formatDate(input, 'JST', 'M/d');
              break
          };
        };
        function shiftDate(input, value){
          let result = new Date(input);
          result.setDate(input.getDate() + value);
          return result;
        }

        if (date.getHours() == 0 && date.getMinutes() == 0){
          // 終日
          if (values[1] == '期限'){
            return relativeDate(shiftDate(date, -1));
          } else if(values[1] == 'イベント'){
            return relativeDate(date);
          };
        } else {
          // 時間指定あり
          return relativeDate(date) + ' ' + Utilities.formatDate(date, 'JST', 'H:mm');
        };
      };
    } else{
      // 過去
      archiveSheet.getRange((archiveSheet.getLastRow() + 1),1,1,3).setValues([values])
      upNextSheet.deleteRow(i)
    };
    
  }
  archiveSheet.getRange(2,1,archiveSheet.getLastRow()).setNumberFormat("yyyy/MM/dd HH:mm");
  archiveSheet.getRange(2,1,archiveSheet.getLastRow(),archiveSheet.getLastColumn()).sort({column: 1, ascending: true});
  sendLineNotify(content);


  function sendLineNotify(message){
    const options =
    {
        "method"  : "post",
        "payload" : {"message": message},
        "headers" : {"Authorization":"Bearer " + PropertiesService.getScriptProperties().getProperty("LINENotifyToken")}
    };
    UrlFetchApp.fetch("https://notify-api.line.me/api/notify", options);
  };
}

function sendNotificationAndCalendar(e) {
  // 1. 通知を受け取りたいメールアドレスを指定
  var adminEmail = 'asataxi2026@gmail.com'; 
  
  var items = e.response.getItemResponses();
  var message = 'Googleフォームから新しい予約が入りました。\n\n';
  message += '【予約内容】\n';
  message += '-------------------------------------------------\n';
  
  var customerName = 'お客様';
  var dateStr = '';
  
  for (var i = 0; i < items.length; i++) {
    var question = items[i].getItem().getTitle();
    var answer = items[i].getResponse();
    
    if (Array.isArray(answer)) {
      answer = answer.join(', ');
    }
    
    // カレンダー用の情報を抜き出す
    if (question.indexOf('お名前') !== -1) customerName = answer;
    if (question.indexOf('ご希望日時') !== -1) dateStr = answer;
    
    message += question + '：\n' + answer + '\n\n';
  }
  message += '-------------------------------------------------\n';
  
  var subject = '【自動通知】あさタクシー 新規ご予約のお知らせ';
  var eventTitle = '【予約】' + customerName + ' 様';
  
  var calendar = CalendarApp.getDefaultCalendar(); // ご自身のメインカレンダー
  var eventDate = null;
  var endTime = null;
  var isDuplicate = false;
  var dateParsedSuccessfully = false;
  
  try {
    // 日付をプログラミング用（Date型）に変換（安全のためハイフンをスラッシュに変換）
    // フォームの「日時」項目は通常 yyyy-MM-dd HH:mm 形式で届きます
    var safeDateStr = dateStr.replace(/-/g, '/');
    eventDate = new Date(safeDateStr);
    
    // 日付が正しく読み取れた場合
    if (!isNaN(eventDate.getTime())) {
      dateParsedSuccessfully = true;
      // 便宜上「1時間の予定」としてカレンダー枠を確保します
      endTime = new Date(eventDate.getTime() + (60 * 60 * 1000)); 
      
      // 重複チェック: 同じ日時の予定を取得
      var conflicts = calendar.getEvents(eventDate, endTime);
      if (conflicts.length > 0) {
        isDuplicate = true;
        subject = '🚨予約重複注意🚨 ' + subject;
        eventTitle = '🚨予約重複注意🚨 ' + eventTitle;
        message = '※この時間帯には既に別の予定（' + conflicts.length + '件）が入っています！カレンダーを確認してください。\n\n' + message;
      }
    }
  } catch(error) {
    Logger.log('日付チェックエラー: ' + error.message);
  }

  // ① メール通知を送信
  MailApp.sendEmail({
    to: adminEmail,
    subject: subject,
    body: message
  });
  
  // ② Googleカレンダーへの自動登録
  try {
    if (dateParsedSuccessfully) {
      calendar.createEvent(eventTitle, eventDate, endTime, {
        description: message
      });
      Logger.log('カレンダーに予定を登録しました: ' + eventTitle);
    } else {
      // 万が一フォームの日付形式が読み取れなかった場合は、今日の日付で終日イベントとして登録
      var today = new Date();
      calendar.createAllDayEvent('【日時要確認】予約: ' + customerName + ' 様', today, {
        description: '※ご希望日時の自動読み取りができませんでした。手動で日時を変更してください。\n\n' + message
      });
      Logger.log('日付読み取りエラー：要確認としてカレンダーに登録しました');
    }
  } catch(error) {
    Logger.log('カレンダー登録エラー: ' + error.message);
  }
}

// ---------------------------------------------------------
// ▼ トリガーを自動設定するプログラム（仕上げ） ▼
// ---------------------------------------------------------
function setupCalendarTriggerAuto() {
  var formId = '1OJX7W4_ocEsPzrOf85XLNeUUoRjcMdf0VXFD1aHEAUo'; 
  var form = FormApp.openById(formId);
  
  // 今あるトリガーを一旦リセット
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // 新しい「カレンダー付」のシステムを設定
  ScriptApp.newTrigger('sendNotificationAndCalendar')
           .forForm(form)
           .onFormSubmit()
           .create();
           
  Logger.log('【設定完了】カレンダー自動登録の仕組みがセットされました！');
}

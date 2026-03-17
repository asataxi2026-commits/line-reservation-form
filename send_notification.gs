function sendNotificationEmail(e) {
  // 1. 通知を受け取りたいご自身のメールアドレスを指定
  var adminEmail = 'asataxi2026@gmail.com'; // ★変更済みです！
  
  var items = e.response.getItemResponses();
  var message = 'Googleフォームから新しい予約が入りました。\n\n';
  message += '【予約内容】\n';
  message += '-------------------------------------------------\n';
  
  for (var i = 0; i < items.length; i++) {
    var question = items[i].getItem().getTitle();
    var answer = items[i].getResponse();
    
    if (Array.isArray(answer)) {
      answer = answer.join(', ');
    }
    message += question + '：\n' + answer + '\n\n';
  }
  message += '-------------------------------------------------\n';
  message += '※このメールは自動送信システムから送信されています。';
  
  var subject = '【自動通知】あさタクシー 新規ご予約のお知らせ';
  
  MailApp.sendEmail({
    to: adminEmail,
    subject: subject,
    body: message
  });
}

// ---------------------------------------------------------
// ▼ エラー回避用：トリガーを自動設定するプログラム ▼
// ---------------------------------------------------------
function setupTriggerAuto() {
  var formId = '1OJX7W4_ocEsPzrOf85XLNeUUoRjcMdf0VXFD1aHEAUo'; // フォームID
  var form = FormApp.openById(formId);
  
  // 今あるトリガーを一旦リセット
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
  }
  
  // 新しく「送信時」のトリガーをプログラムで設定
  ScriptApp.newTrigger('sendNotificationEmail')
           .forForm(form)
           .onFormSubmit()
           .create();
           
  Logger.log('【設定完了】これでエラーを回避して自動通知が設定されました！');
}

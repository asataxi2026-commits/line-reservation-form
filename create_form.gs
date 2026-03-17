function createReservationForm() {
  // 1. 新しいGoogleフォームを作成し、タイトルを設定
  var form = FormApp.create('介護タクシー ご予約受付フォーム');
  
  // 2. フォームの説明文を設定
  form.setDescription('ご予約ありがとうございます。以下の項目にご入力のうえ、送信ボタンを押してください。');
  
  // 3. 必要な質問項目を追加
  
  // お名前（記述式・必須）
  var nameItem = form.addTextItem();
  nameItem.setTitle('お名前').setRequired(true);
  
  // ご連絡先（記述式・必須）
  var phoneItem = form.addTextItem();
  phoneItem.setTitle('ご連絡先（お電話番号）').setRequired(true);
  
  // ご希望日時（日時・必須）
  var datetimeItem = form.addDateTimeItem();
  datetimeItem.setTitle('ご希望日時').setRequired(true);
  
  // お迎え先（段落・必須）
  var pickupItem = form.addParagraphTextItem();
  pickupItem.setTitle('お迎え先（ご住所や施設名など）').setRequired(true);
  
  // 目的地（段落・必須）
  var destinationItem = form.addParagraphTextItem();
  destinationItem.setTitle('目的地').setRequired(true);
  
  // その他のご要望（段落・任意）
  var otherItem = form.addParagraphTextItem();
  otherItem.setTitle('その他のご要望・事前にお知らせいただくこと')
           .setHelpText('お荷物の多さ、お付き添いの方の人数などを自由にご記入ください。')
           .setRequired(false);
           
  // 4. 完了メッセージをログに出力
  Logger.log('=========================================');
  Logger.log('フォームが作成されました！');
  Logger.log('▼回答用URL（お客様に案内するリンク）');
  Logger.log(form.getPublishedUrl());
  Logger.log('=========================================');
  Logger.log('▼編集用URL（内容を修正したい場合のリンク）');
  Logger.log(form.getEditUrl());
  Logger.log('=========================================');
}

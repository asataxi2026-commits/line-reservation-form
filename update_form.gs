function renamePhoneCallConfirmation() {
  var formId = '1OJX7W4_ocEsPzrOf85XLNeUUoRjcMdf0VXFD1aHEAUo';
  var form = FormApp.openById(formId);
  var items = form.getItems();
  
  for (var i = 0; i < items.length; i++) {
    var item = items[i];
    var title = item.getTitle();
    
    // 「確認のお電話について」という項目を探して名前を変更
    if (title === '確認のお電話について') {
      item.setTitle('予約確認のお電話について');
      Logger.log('項目名名を「予約確認のお電話について」に変更しました！');
      return;
    }
  }
  Logger.log('対象の項目が見つかりませんでした。');
}

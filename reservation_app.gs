// 予約システムの基本設定
const CONFIG = {
  adminEmail: 'asataxi2026@gmail.com', // 管理者のメールアドレス
  startTime: 6,       // 営業開始時間（例: 6時）
  endTime: 18,        // 営業終了時間（例: 18時）
  slotInterval: 15,   // カレンダーに表示する枠の間隔（分）（15分刻み）
  durationMinutes: 60,// 1回の予約で確保する時間（分）（60分）
  daysToShow: 90,     // カレンダーに表示する日数（約3ヶ月）
  allowSameDay: false // 当日の予約を許可するかどうか（今回は不可）
};

// Webアプリにアクセスしたときに画面(HTML)を表示する関数
function doGet(e) {
  return HtmlService.createHtmlOutputFromFile('reservation_form')
      .setTitle('あさタクシー ご予約カレンダー')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// 空き状況を取得する関数（画面側から呼び出されます）
function getAvailability() {
  const calendar = CalendarApp.getDefaultCalendar();
  const today = new Date();
  
  // 今日の時間を0時0分にセット
  today.setHours(0, 0, 0, 0);
  
  // 90日後の日付を計算
  const endPeriod = new Date(today);
  endPeriod.setDate(today.getDate() + CONFIG.daysToShow);
  
  // ▼ 高速化の要：90日分の予定を「1回だけ」まとめて取得する
  const allEvents = calendar.getEvents(today, endPeriod);
  
  // 取得した予定のスタート時間と終了時間を見やすい配列にしておく
  const bookedTimes = allEvents.map(event => {
    return {
      start: event.getStartTime().getTime(),
      end: event.getEndTime().getTime()
    };
  });
  
  const availability = [];
  
  for (let i = 0; i < CONFIG.daysToShow; i++) {
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + i);
    
    // 当日予約不可の場合、今日（i === 0）はスキップ
    if (!CONFIG.allowSameDay && i === 0) {
      continue;
    }
    
    const dayStr = Utilities.formatDate(targetDate, Session.getScriptTimeZone(), 'yyyy-MM-dd');
    const slots = [];
    
    for (let hour = CONFIG.startTime; hour < CONFIG.endTime; hour++) {
      for (let min = 0; min < 60; min += CONFIG.slotInterval) {
        const slotStart = new Date(targetDate);
        slotStart.setHours(hour, min, 0, 0);
        
        const slotEnd = new Date(targetDate);
        // 確保する時間は durationMinutes (60分)
        slotEnd.setTime(slotStart.getTime() + (CONFIG.durationMinutes * 60 * 1000));
        
        // 営業終了時間を超える予約枠は作らない
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(CONFIG.endTime, 0, 0, 0);
        if (slotEnd > endOfDay) {
          continue; 
        }

        const slotStartTime = slotStart.getTime();
        const slotEndTime = slotEnd.getTime();
        
        const timeStr = Utilities.formatDate(slotStart, Session.getScriptTimeZone(), 'HH:mm');
        
        // 過去の時間はスキップ
        const now = new Date();
        if (slotStart <= now) {
          slots.push({ time: timeStr, isAvailable: false, reason: "past" });
          continue;
        }

        // ▼ お客様のビジネスルールに合わせた重複チェック
        // カレンダーの予定時間帯（b.start ～ b.end）の中に、この予約枠の「開始時間」が含まれているかだけを判定
        // これにより、17時の予定に対して16:15等の前枠がブロックされるのを防ぎます
        let hasConflict = false;
        for (let j = 0; j < bookedTimes.length; j++) {
          const b = bookedTimes[j];
          // スロットの範囲 [slotStartTime, slotEndTime] と
          // 既存予定の範囲 [b.start, b.end] が1分でも重なればNG
          if (slotStartTime < b.end && slotEndTime > b.start) {
            hasConflict = true;
            break;
          }
        }
        
        slots.push({
          time: timeStr,
          isAvailable: !hasConflict // 重複がなければ true（空き）
        });
      }
    }
    
    availability.push({
      date: dayStr,
      displayDate: Utilities.formatDate(targetDate, Session.getScriptTimeZone(), 'M/d'),
      slots: slots
    });
  }
  
  // GASの仕様で複雑な配列を返すとコールバックが発火しないバグを回避するため、文字列にして返す
  return JSON.stringify(availability);
}

// 通信テスト用関数
function testPing() {
  return "PONG";
}

// 予約を登録する関数（画面側から呼び出されます）
function submitReservation(data) {
  try {
    const calendar = CalendarApp.getDefaultCalendar();
    
    // data.date = 'yyyy-MM-dd'
    // data.time = 'HH:mm'
    const [year, month, day] = data.date.split('-');
    const [hour, minute] = data.time.split(':');
    
    // 登録用の日付オブジェクトを作成（GASのプロジェクト設定のタイムゾーンが使用されます）
    const startDate = new Date(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), 0);
    const endDate = new Date(startDate.getTime() + (CONFIG.durationMinutes * 60 * 1000));
    
    // 再度、予約可能かチェック（画面表示後に予定が入ってしまった場合への対策）
    // 厳密な範囲チェック
    const events = calendar.getEvents(new Date(startDate.getTime() - 1000), new Date(endDate.getTime() + 1000));
    let hasConflict = false;
    const startNum = startDate.getTime();
    const endNum = endDate.getTime();
    
    for (const event of events) {
      if (startNum < event.getEndTime().getTime() && endNum > event.getStartTime().getTime()) {
        hasConflict = true;
        break;
      }
    }

    if (hasConflict) {
      return { success: false, message: '申し訳ありません。ご選択の時間は直前に埋まってしまいました。別のお時間をお選びください。' };
    }
    
    const customerName = data.name || 'お客様';
    const eventTitle = customerName + ' 様【予約】';
    
    const description = `Googleフォーム（新アプリ）からの予約\n\n` +
                        `お名前：${data.name}\n` +
                        `お迎え先：${data.pickup}\n` +
                        `目的地：${data.dropoff}\n` +
                        `介護度：${data.careLevel}\n` +
                        `予約される方：${data.callerType}\n` +
                        `お電話番号：${data.phone}\n` +
                        `往復利用：${data.roundTrip}\n` +
                        `オプション：${data.options}\n` +
                        `電話確認：${data.callConfirm}\n` +
                        `備考：\n${data.notes || 'なし'}\n`;
    
    // カレンダーへ登録
    calendar.createEvent(eventTitle, startDate, endDate, {
      description: description
    });
    
    // メール通知
    let subject = '【自動通知】あさタクシー 新規ご予約のお知らせ';
    if (data.callConfirm === '必要') {
      subject = '【🚨要電話確認】あさタクシー 新規ご予約のお知らせ';
    }
    MailApp.sendEmail({
      to: CONFIG.adminEmail,
      subject: subject,
      body: description
    });
    
    return { success: true, message: '予約が完了しました！' };
    
  } catch(error) {
    Logger.log(error.message);
    return { success: false, message: 'システムエラーが発生しました。お電話にてお問い合わせください。' };
  }
}

// 概算見積もりの計算
function calculateEstimate(pickup, dropoff, careLevel, optionsStr, roundTrip) {
  try {
    let distanceMeter = 0;
    try {
      // Directions APIで距離と時間を取得
      const directions = Maps.newDirectionFinder()
        .setOrigin(pickup)
        .setDestination(dropoff)
        .setMode(Maps.DirectionFinder.Mode.DRIVING)
        .setAvoid(Maps.DirectionFinder.Avoid.TOLLS)
        .setLanguage('ja')
        .getDirections();
        
      if (directions.routes && directions.routes.length > 0) {
        distanceMeter = directions.routes[0].legs[0].distance.value;
      }
    } catch(e) {
      Logger.log("Map Error: " + e.message);
    }

    // 1. 運賃計算（初乗り1.45kmまで750円、以後320mごとに100円）
    let fare = 750;
    if (distanceMeter > 1450) {
      const extraDistance = distanceMeter - 1450;
      const extraUnits = Math.ceil(extraDistance / 320);
      fare += extraUnits * 100;
    }

    // 2. 基本介助料
    let careFee = 0;
    switch(careLevel) {
      case '要介護1': careFee = 500; break;
      case '要介護2': careFee = 1000; break;
      case '要介護3': careFee = 1500; break;
      case '要介護4': careFee = 2000; break;
      case '要介護5': careFee = 2500; break;
      // 要支援1, 2, 該当なし は0円
    }

    // 3. 機材使用料（オプション）
    let equipmentFee = 0;
    const options = optionsStr ? optionsStr.split('、 ') : [];
    if (options.includes('車いす')) equipmentFee += 500;
    if (options.includes('リクライニング車いす')) equipmentFee += 2000;
    if (options.includes('ストレッチャー')) equipmentFee += 4000;
    if (options.includes('スライディングボード')) equipmentFee += 1000;

    let totalEstimate = fare + careFee + equipmentFee;
    if (distanceMeter === 0) {
      totalEstimate = careFee + equipmentFee; // 距離計算不可の場合は運賃なしで表示
    }

    // フラグ
    const needsSupportWarning = options.includes('階段サポート') || options.includes('お付き添いサポート');
    const isNoCareLevel = (careLevel === '該当なし');
    const isRoundTrip = (roundTrip === 'はい（往復）');

    return {
      success: true,
      distance: distanceMeter,
      fare: fare,
      careFee: careFee,
      equipmentFee: equipmentFee,
      total: totalEstimate,
      needsSupportWarning: needsSupportWarning,
      isNoCareLevel: isNoCareLevel,
      isRoundTrip: isRoundTrip
    };
  } catch(error) {
    return { success: false, message: error.message };
  }
}

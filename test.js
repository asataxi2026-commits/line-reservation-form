
    // Global state
    let availabilityData = [];
    let selectedDate = null;
    let selectedTime = null;
    // デバッグログ追加用
    function addLog(msg) {
      const debugDiv = document.getElementById('debug-log');
      if (debugDiv) {
        debugDiv.innerHTML += '<br>[' + new Date().toLocaleTimeString() + '] ' + msg;
        debugDiv.scrollTop = debugDiv.scrollHeight;
      }
    }

    // Initialize: Fetch data from GAS server
    function checkAvailabilityInit() {
      addLog("checkAvailabilityInit() が呼ばれました");
      try {
        if (typeof google !== 'undefined' && google.script && google.script.run) {
           addLog("google.script.run は正常に認識されました。通信を開始します...");
           google.script.run
            .withSuccessHandler(function(data) {
              addLog("通信成功！カレンダーデータを取得しました。");
              renderDates(data);
            })
            .withFailureHandler(function(err) {
              addLog("通信エラー捕捉：" + (err ? (err.message || String(err)) : "詳細不明"));
              showError(err);
            })
            .getAvailability();
        } else {
          addLog("google.script.run が見つかりませんでした。テスト用モックデータを使用します。");
          setTimeout(() => {
            const testData = [
              { date: '2026-03-15', displayDate: '3/15', slots: [
                {time: '09:00', isAvailable: false}, {time: '09:15', isAvailable: false}, {time: '09:30', isAvailable: true}, {time: '09:45', isAvailable: true}, {time: '10:00', isAvailable: true}
              ]}
            ];
            renderDates(testData);
          }, 1000);
        }
      } catch (err) {
        addLog("構文エラーまたは実行エラー: " + err.message);
        showError(err);
      }
    };
    
    // 即座に実行（window.onload の不具合を回避）
    addLog("スクリプトの実行を開始します...");
    setTimeout(checkAvailabilityInit, 100);

    function showError(err) {
      document.getElementById('loader').style.display = 'none';
      const msg = document.getElementById('result-message');
      const errText = err ? (err.message || String(err)) : "不明なエラー";
      msg.innerHTML = `<strong>エラーが発生しました。</strong><br><span style="font-size: 0.85rem;">[詳細] ${errText}</span><br>時間を置いて再度お試しいただくか、お電話にてご連絡ください。`;
      msg.className = 'message-box error';
      msg.style.display = 'block';
    }

    const weekdays = ['日', '月', '火', '水', '木', '金', '土'];

    function renderDates(data) {
      availabilityData = data;
      document.getElementById('loader').style.display = 'none';
      document.getElementById('calendar-section').style.display = 'block';
      
      const container = document.getElementById('dates-container');
      container.innerHTML = '';
      
      if(data.length === 0) {
        container.innerHTML = '<p>現在予約可能な日程がありません。</p>';
        return;
      }
      
      data.forEach((dayData, index) => {
        const dateObj = new Date(dayData.date);
        const parts = dayData.displayDate.split('/'); // ["3", "15"]
        const month = parts[0];
        const day = parts[1];
        const weekday = weekdays[dateObj.getDay()];
        
        const btn = document.createElement('div');
        btn.className = 'date-btn' + (index === 0 ? ' active' : '');
        btn.innerHTML = `
          <span class="month">${month}月</span>
          <span class="day">${day}</span>
          <span class="weekday">(${weekday})</span>
        `;
        
        btn.onclick = () => selectDate(dayData.date, btn);
        container.appendChild(btn);
      });
      
      // Select first day by default
      selectDate(data[0].date, container.firstChild);
    }
    
    function selectDate(dateStr, btnElement) {
      selectedDate = dateStr;
      selectedTime = null;
      document.getElementById('booking-form').style.display = 'none';
      
      // Update active state on buttons
      document.querySelectorAll('.date-btn').forEach(btn => btn.classList.remove('active'));
      if(btnElement) btnElement.classList.add('active');
      
      // Find slots for this date
      const dayData = availabilityData.find(d => d.date === dateStr);
      renderSlots(dayData ? dayData.slots : []);
    }
    
    function renderSlots(slots) {
      const container = document.getElementById('slots-container');
      container.innerHTML = '';
      
      if(slots.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color:#64748b;">この日の枠はありません</p>';
        return;
      }
      
      slots.forEach(slot => {
        const btn = document.createElement('button');
        btn.className = 'slot-btn';
        btn.textContent = slot.time;
        
        if(!slot.isAvailable) {
          btn.disabled = true;
        } else {
          btn.onclick = () => selectTime(slot.time, btn);
        }
        
        container.appendChild(btn);
      });
    }
    
    function selectTime(timeStr, btnElement) {
      selectedTime = timeStr;
      
      // Update active state
      document.querySelectorAll('.slot-btn').forEach(btn => btn.classList.remove('active'));
      btnElement.classList.add('active');
      
      // Show form
      const form = document.getElementById('booking-form');
      form.style.display = 'block';
      
      // Set display text
      const dateObj = new Date(selectedDate);
      const displayStr = `${dateObj.getMonth()+1}月${dateObj.getDate()}日(${weekdays[dateObj.getDay()]}) ${timeStr} 予約`;
      document.getElementById('selected-datetime-display').textContent = displayStr;
      
      // Scroll to form smoothly
      setTimeout(() => {
        form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    }
    
    // 確認画面へ進む処理
    function showConfirmation() {
      // Validate form
      if(!selectedDate || !selectedTime) {
        alert('ご希望の日時を選択してください。');
        return;
      }
      
      // カスタムバリデーション
      const reqInputs = [
        document.getElementById('cust-name'),
        document.getElementById('cust-pickup'),
        document.getElementById('cust-dropoff'),
        document.getElementById('cust-phone')
      ];
      for (const input of reqInputs) {
        if (!input.value) {
          alert('必須項目（*）をすべて入力してください。');
          return;
        }
      }

      // Collect data to calculate estimate

      const pickup = document.getElementById('cust-pickup').value;
      const dropoff = document.getElementById('cust-dropoff').value;
      const getRadioVal = (name) => {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
      };
      const careLevel = getRadioVal('care_level');
      const roundTrip = getRadioVal('round_trip');
      
      const optionElements = document.querySelectorAll('input[name="options"]:checked');
      const optionsArray = Array.from(optionElements).map(el => el.value);
      const optionsStr = optionsArray.length > 0 ? optionsArray.join('、 ') : '';

      document.getElementById('submit-btn').textContent = '料金計算中...';
      document.getElementById('submit-btn').disabled = true;

      // Call GAS function
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(function(res) {
            document.getElementById('submit-btn').textContent = '予約の確認';
            document.getElementById('submit-btn').disabled = false;
            if(res.success) {
              displayConfirmation(res);
            } else {
              alert('料金計算中にエラーが発生しました。\n' + res.message);
            }
          })
          .withFailureHandler(function(err) {
            document.getElementById('submit-btn').textContent = '予約の確認';
            document.getElementById('submit-btn').disabled = false;
            alert('通信エラーが発生しました。時間を置いて再度お試しください。');
          })
          .calculateEstimate(pickup, dropoff, careLevel, optionsStr, roundTrip);
      } else {
        // Fallback for local testing
        setTimeout(() => {
          document.getElementById('submit-btn').textContent = '予約の確認';
          document.getElementById('submit-btn').disabled = false;
          displayConfirmation({
            success: true, distance: 5000, fare: 1850, careFee: 1000, equipmentFee: 500, total: 3350,
            needsSupportWarning: true, isNoCareLevel: true, isRoundTrip: true
          });
        }, 1000);
      }
    }

    function displayConfirmation(est) {
      document.getElementById('booking-form').style.display = 'none';
      const confSection = document.getElementById('confirmation-section');
      confSection.style.display = 'block';

      document.getElementById('est-total').textContent = est.total.toLocaleString();
      
      if (est.distance > 0) {
        const km = (est.distance / 1000).toFixed(1);
        document.getElementById('est-distance').textContent = `(距離目安: 約${km}km)`;
        document.getElementById('est-fare').textContent = est.fare.toLocaleString() + ' 円';
      } else {
        document.getElementById('est-distance').textContent = '(マップ計算不可)';
        document.getElementById('est-fare').textContent = '---（当日確認）';
        document.getElementById('est-total').textContent = '-----';
      }

      document.getElementById('est-care').textContent = est.careFee.toLocaleString() + ' 円';
      document.getElementById('est-equipment').textContent = est.equipmentFee.toLocaleString() + ' 円';

      let warningsHtml = '';
      if (est.isRoundTrip) {
        warningsHtml += `<div style="margin-bottom:8px; padding:8px; background:#fff; border-left:4px solid #ea580c; border-radius:4px;">
          <strong style="color:#ea580c;">※往復ご利用のお客様へ</strong><br>上記は「片道分」の概算料金です。お帰りの運賃や機材費は別途かかります。
        </div>`;
      }
      if (est.needsSupportWarning) {
        warningsHtml += `<div style="margin-bottom:8px; padding:8px; background:#fff; border-left:4px solid #3b82f6; border-radius:4px;">
          <strong style="color:#3b82f6;">※サポート料金について</strong><br>階段サポートやお付き添いの料金は、現場の状況や所要時間などにより当日に算出させていただきます。<span style="font-size:0.8rem; color:#666;">（目安: 階段 1,000円〜 / 付き添い 1分50円）</span>
        </div>`;
      }
      if (est.isNoCareLevel) {
        warningsHtml += `<div style="margin-bottom:8px; padding:8px; background:#fff; border-left:4px solid #10b981; border-radius:4px;">
          <strong style="color:#10b981;">※基本介助料について</strong><br>介護度がお分かりにならない方、または初回ご利用の方につきましては、お身体の状況に合わせた最適なサポートをご提案するため、事前にお電話にて確認等させていただく場合がございます。
        </div>`;
      }
      document.getElementById('est-warnings').innerHTML = warningsHtml;

      const getRadioVal = (name) => {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : '';
      };
      
      let callerType = getRadioVal('caller_type');
      if (callerType === 'その他') callerType = document.getElementById('caller-other-text').value || 'その他';

      const optionElements = document.querySelectorAll('input[name="options"]:checked');
      const optionsArray = Array.from(optionElements).map(el => el.value);
      const optionsStr = optionsArray.length > 0 ? optionsArray.join('、 ') : 'なし';

      const detailsHtml = `
        <strong>日時：</strong>${document.getElementById('selected-datetime-display').textContent}<br>
        <strong>お名前：</strong>${document.getElementById('cust-name').value}<br>
        <strong>お迎え先：</strong>${document.getElementById('cust-pickup').value}<br>
        <strong>目的地：</strong>${document.getElementById('cust-dropoff').value}<br>
        <strong>予約者：</strong>${callerType}<br>
        <strong>電話：</strong>${document.getElementById('cust-phone').value}<br>
        <strong>往復：</strong>${getRadioVal('round_trip')}<br>
        <strong>介護度：</strong>${getRadioVal('care_level')}<br>
        <strong>オプション：</strong>${optionsStr}<br>
        <strong>確認電話：</strong>${getRadioVal('call_confirm')}<br>
        <strong>備考：</strong><br>${(document.getElementById('cust-notes').value || 'なし').replace(/\n/g, '<br>')}
      `;
      document.getElementById('confirm-details-list').innerHTML = detailsHtml;
      
      confSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    function hideConfirmation() {
      document.getElementById('confirmation-section').style.display = 'none';
      const form = document.getElementById('booking-form');
      form.style.display = 'block';
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    
    // 最終的なフォーム送信処理
    function submitBooking() {
      // Get selected radio values
      const getRadioVal = (name) => {
        const selected = document.querySelector(`input[name="${name}"]:checked`);
        return selected ? selected.value : null;
      };

      const name = document.getElementById('cust-name').value;
      const phone = document.getElementById('cust-phone').value;
      const pickup = document.getElementById('cust-pickup').value;
      const dropoff = document.getElementById('cust-dropoff').value;
      
      let callerType = getRadioVal('caller_type');
      if (callerType === 'その他') {
        const otherText = document.getElementById('caller-other-text').value;
        callerType = otherText ? `その他（${otherText}）` : 'その他';
      }
      
      const roundTrip = getRadioVal('round_trip');
      const careLevel = getRadioVal('care_level');
      const callConfirm = getRadioVal('call_confirm');
      const notes = document.getElementById('cust-notes').value;
      
      const optionNodes = document.querySelectorAll('input[name="options"]:checked');
      const optionsArr = Array.from(optionNodes).map(node => node.value);
      const optionsStr = optionsArr.length > 0 ? optionsArr.join('、 ') : 'なし';

      if(!name || !phone || !pickup || !dropoff || !callerType || !roundTrip || !careLevel || !callConfirm) {
        alert("必須項目（*）をすべて入力・選択してください。");
        return;
      }
      
      const payload = {
        date: selectedDate,
        time: selectedTime,
        name: name,
        callerType: callerType,
        phone: phone,
        pickup: pickup,
        dropoff: dropoff,
        roundTrip: roundTrip,
        careLevel: careLevel,
        options: optionsStr,
        callConfirm: callConfirm,
        notes: notes
      };
      
      // UI Update
      const btn = document.getElementById('final-submit-btn');
      btn.disabled = true;
      btn.innerHTML = '<div class="spinner" style="width:20px;height:20px;margin:0 10px 0 0;border-width:2px;border-top-color:#fff;"></div> 送信中...';
      document.getElementById('confirmation-section').style.display = 'none';
      document.getElementById('loader').style.display = 'flex';
      
      if (typeof google !== 'undefined' && google.script && google.script.run) {
        google.script.run
          .withSuccessHandler(handleSuccess)
          .withFailureHandler(handleFailure)
          .submitReservation(payload);
      } else {
        // Mock success
        setTimeout(() => handleSuccess({success: true, message: '【テスト】予約が完了しました！'}), 1500);
      }
    }
    
    function handleSuccess(response) {
      document.getElementById('calendar-section').style.display = 'none';
      document.getElementById('booking-form').style.display = 'none';
      
      const msg = document.getElementById('result-message');
      msg.style.display = 'block';
      
      if(response.success) {
        msg.className = 'message-box success';
        msg.innerHTML = `<h3>✅ 予約完了</h3><p style="margin-top:10px;">${response.message}</p><p style="margin-top:15px;font-size:0.9em;">この画面を閉じてLINEにお戻りください。</p>`;
      } else {
        msg.className = 'message-box error';
        msg.innerHTML = `<h3>❌ エラー</h3><p style="margin-top:10px;">${response.message}</p>
          <button onclick="location.reload()" style="margin-top:15px;padding:8px 16px;border-radius:8px;border:none;background:#ef4444;color:white;cursor:pointer;">カレンダーを再読み込み</button>`;
      }
    }
    
    function handleFailure(error) {
      alert("通信エラーが発生しました。もう一度お試しください。");
      const btn = document.getElementById('submit-btn');
      btn.disabled = false;
      btn.innerHTML = '予約を確定する';
    }
  
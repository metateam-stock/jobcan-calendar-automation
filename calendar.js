let selectedDates = []; // 日付を格納する配列

const weeks = ['日', '月', '火', '水', '木', '金', '土']
const date = new Date()
let year = date.getFullYear()
let month = date.getMonth() + 1
const config = {
    show: 1, // 表示するカレンダーの月数
}



function showCalendar(year, month) {
    for (i = 0; i < config.show; i++) {
        const calendarHtml = createCalendar(year, month)
        const sec = document.createElement('section')
        sec.innerHTML = calendarHtml
        document.querySelector('#calendar').appendChild(sec)

        month++
        if (month > 12) {
            year++
            month = 1
        }
    }

    // 新しい日付のクリックを監視
    document.querySelectorAll('.selectable').forEach((cell) => {
        cell.addEventListener('click', (e) => {
            const clickedDate = e.target.getAttribute('data-date');
            if (!selectedDates.includes(clickedDate)) {
                selectedDates.push(clickedDate); // 日付を配列に追加
                e.target.style.backgroundColor = 'yellow'; // 背景色を黄色に変更
            } else {
                // すでにクリックされた日付なら、配列から削除し、背景色を元に戻す
                selectedDates.splice(selectedDates.indexOf(clickedDate), 1);
                e.target.style.backgroundColor = '';
            }
        });
    });
}

function createCalendar(year, month) {
    const startDate = new Date(year, month - 1, 1) // 月の最初の日を取得
    const endDate = new Date(year, month, 0) // 月の最後の日を取得
    const endDayCount = endDate.getDate() // 月の末日
    const lastMonthEndDate = new Date(year, month - 1, 0) // 前月の最後の日の情報
    const lastMonthendDayCount = lastMonthEndDate.getDate() // 前月の末日
    const startDay = startDate.getDay() // 月の最初の日の曜日を取得
    let dayCount = 1 // 日にちのカウント
    let calendarHtml = '' // HTMLを組み立てる変数

    calendarHtml += '<h1>' + year + '/' + month + '</h1>'
    calendarHtml += '<table>'

    // 曜日の行を作成
    for (let i = 0; i < weeks.length; i++) {
        calendarHtml += '<td>' + weeks[i] + '</td>'
    }

    for (let w = 0; w < 6; w++) {
        calendarHtml += '<tr>'

        for (let d = 0; d < 7; d++) {
            if (w == 0 && d < startDay) {
                // 1行目で1日の曜日の前
                let num = lastMonthendDayCount - startDay + d + 1
                calendarHtml += '<td class="is-disabled">' + num + '</td>'
            } else if (dayCount > endDayCount) {
                // 末尾の日数を超えた
                let num = dayCount - endDayCount
                calendarHtml += '<td class="is-disabled">' + num + '</td>'
                dayCount++
            } else {
                let num = dayCount;
                calendarHtml += '<td class="selectable" data-date="' + year + '/' + month + '/' + num + '">' + num + '</td>';
                // calendarHtml += '<td>' + dayCount + '</td>'
                dayCount++
            }
        }
        calendarHtml += '</tr>'
    }
    calendarHtml += '</table>'

    return calendarHtml
}

function moveCalendar(e) {
    document.querySelector('#calendar').innerHTML = ''

    if (e.target.id === 'prev') {
        month--

        if (month < 1) {
            year--
            month = 12
        }
    }

    if (e.target.id === 'next') {
        month++

        if (month > 12) {
            year++
            month = 1
        }
    }

    showCalendar(year, month)
}

document.addEventListener('DOMContentLoaded', function () {
    document.querySelector('#login').addEventListener('click', openNewLoginTab)
    document.querySelector('#prev').addEventListener('click', moveCalendar)
    document.querySelector('#next').addEventListener('click', moveCalendar)

    showCalendar(year, month)


    // 送信ボタンを取得
    document.querySelector('#start').addEventListener('click', async () => {
        for (let date of selectedDates) {
            let convertedDate = convertDate(date);
            let url = `https://ssl.jobcan.jp/m/work/accessrecord?recordDay=${convertedDate}`;
            // 指定のURLに遷移する
            await chrome.tabs.update({ url: url });
            // 3秒待機
            await new Promise(resolve => setTimeout(resolve, 3000));

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    func: (date) => {
                        // "new_selection" という id を持つ select 要素を探す
                        let selectElement = document.querySelector('#new_selection');

                        let saveElement = document.evaluate(
                            '//*[@id="insert_button_selection_remarks"]',
                            document,
                            null,
                            XPathResult.FIRST_ORDERED_NODE_TYPE,
                            null
                          ).singleNodeValue;

                        if (selectElement && saveElement) {
                            // 2番目のoptionを選択する
                            selectElement.selectedIndex = 1;
                            // 選択が変更された場合、イベントをトリガーする
                            let changeEvent = new Event('change', { bubbles: true });
                            selectElement.dispatchEvent(changeEvent);
                            // 保存ボタンをクリックする
                            saveElement.click();
                            console.log('申請しました:' + date);
                        } else {
                            console.error('申請に失敗しました:' + date);
                        }
                    },
                    args: [date]
                });
            });
            // 2秒待機
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        // FIXME: カレンダーの背景色との差異が生じるので、空にする処理は一旦コメントアウト
        // selectedDates = []; // 配列を空にする
        console.log('実行が完了しました。終了します');
    });
});

// 新しいタブでページを開く関数
function openNewLoginTab() {
    chrome.tabs.create({ active: true, url: 'https://ssl.jobcan.jp/m/selection-remark-applied/' });
}

// 日付を変換する関数
function convertDate(dateString) {
    // 日付文字列をスラッシュで分割して配列にする
    const parts = dateString.split('/');
    // 年、月、日を取り出して整形
    const year = parts[0];
    // 1桁の月・日は2桁にパディング
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    // 整形した年月日を連結して返す
    return year + month + day;
}
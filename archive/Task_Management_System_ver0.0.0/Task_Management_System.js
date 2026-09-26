//----------------------------------------------------------------------------------------------------------------------------------------------------
//共有用変数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== 定数定義 =====
const DB_NAME = 'taskAppDB'; // IndexedDBのデータベース名
const DB_VERSION = 1; // IndexedDBのバージョン
const STORE_NAME = 'fileHandles'; // ファイルハンドル保存用のストア名
const HANDLE_KEY = 'csvFileHandle'; // 保存するハンドルのキー名
const LS_FOLDERS_KEY = 'tam_folders_v3'; // localStorage保存用フォルダーキー
const LS_MAINTASKS_KEY = 'tam_maintasks_v3'; // localStorage保存用メインタスクキー
const LS_SUBTASKS_KEY = 'tam_subtasks_v3'; // localStorage保存用サブタスクキー
const LS_DETAILTASKS_KEY = 'tam_detailtasks_v3'; // localStorage保存用ディテールタスクキー
const LS_MILESTONES_KEY = 'tam_milestones_v3'; // localStorage保存用マイルストーンキー
const LS_WORKLOAD_THRESHOLD_KEY = 'tam_workload_threshold_v1'; // localStorage保存用の業務余力閾値キー（ブラウザ単位で閾値を保持するために追加した）
const LS_WORKLOAD_AXISMAX_KEY = 'tam_workload_axismax_v1'; // localStorage保存用の業務余力Y軸目盛り上限キー（閾値とは独立してY軸の最大値を保持するために新設した）
const CSV_HEADERS = ['type','id','parentId','title','description','periods','priority','status','createdAt','updatedAt','milestoneDate','milestoneShape','periodTimes','collapsed','ganttOnly','order','actualPeriods','actualPeriodTimes','effort','excludeFromWorkload']; // 末尾に工数(effort)・業務余力計算除外フラグ(excludeFromWorkload)の列を追加している
const PRIORITY_ORDER = { '高':0, '中':1, '低':2 }; // 優先度の並び替え用の順序
const FILE_TYPES = [{ description:'CSVファイル', accept:{ 'text/csv':['.csv'] } }]; // ファイル選択ダイアログの絞り込み条件
const FS_SUPPORTED = 'showOpenFilePicker' in window; // File System Access APIが使えるかどうか
const RESIZE_HANDLE_PX = 6; // バー端をリサイズハンドルとして判定する幅（ピクセル）
const HOUR_SNAP_MINUTES = 30; // 日(時間)ビューでのドラッグ・リサイズのスナップ単位（分）
const GANTT_HEAD_ROW1_PX = 22; // ガントチャート日付ヘッダー1段目（月ラベル行）の高さ(px)。スクロール追従(sticky)のtop位置計算にも使う
const GANTT_HEAD_ROW2_PX = 22; // ガントチャート日付ヘッダー2段目（日番号ラベル行）の高さ(px)。日(時間)ビューではヘッダーがこの1段のみになる
const GANTT_HEAD_ROW3_PX = 20; // ガントチャート日付ヘッダー3段目（曜日ラベル行）の高さ(px)
const GANTT_LABEL_WIDTH_PX = 200; // タスク名専用ペインの幅(px)。以前はgrid-template-columnsの1列目として埋め込んでいたが、ペイン分離に伴い定数として独立させた
const GANTT_ROW_FOLDER_PX = 28; // フォルダー行の高さ(px)。従来のCSS(.gantt-day-cellのmin-height)に合わせた値
const GANTT_ROW_MAIN_PX = 44; // メインタスク（全体行）の高さ(px)。従来の.gantt-overall-rowのheightに合わせた値
const GANTT_ROW_TASK_PX = 48; // サブタスク/ディテールタスク行の高さ(px)。従来の.gantt-task-laneのheightに合わせた値
const WORKLOAD_BAR_MAX_PX = 200; // 業務余力ビューのバーの最大高さ(px)（グラフエリアが少し狭く見える課題に対応するため150から200へ拡大した）
const WORKLOAD_FOOTER_PX = 28; // 業務余力ビューでバーの下に表示する日付・曜日ラベル分の高さ(px)（閾値ラインの位置計算に使う）
const WORKLOAD_COL_GAP_PX = 2; // 業務余力チャートの列と列の間の隙間(px)（CSSの.workload-chartのgapと合わせ、日境目の補助線の位置計算に使う）
const WORKLOAD_CHART_PADDING_LEFT_PX = 8; // 業務余力チャートの左パディング(px)（CSSの.workload-chartのpaddingと合わせ、日境目の補助線の位置計算に使う）
const WORKLOAD_TEXT_MIN_COLWIDTH_PX = 14; // 業務余力チャートで日番号・曜日の文字を表示する最小列幅(px)。これより狭いズームでは文字を省略して見た目の崩れを防ぐ
const WORKLOAD_AXIS_TICK_COUNT = 4; // Y軸目盛りを0を含めて何段階に分割するか（0とniceMaxの間をこの数で等分する）

// ===== ここから追加：業務余力ビュー専用のズームレベルごとの表示日数と1日あたりの幅(px) =====
// ガントチャートのZOOM_PRESETSとは別に用意し、業務余力ビューは表示に余裕があるぶん列幅を広めに取っている
const WORKLOAD_ZOOM_PRESETS = {
  week:    { days: 7,   colWidth: 110 }, // 週表示：直近1週間相当を広い列幅で表示する（表示に余裕があるためガントの週表示より広めにした）
  month:   { days: 30,  colWidth: 40 },  // 月表示：既定表示。従来の固定26pxより広い幅にして余裕を活かす
  quarter: { days: 90,  colWidth: 40 },  // 四半期表示：月表示と同じ列幅(40px)に統一し、日付が詰まって見づらい課題を解消した（ガントチャートのZOOM_PRESETSと同じ対応）
  year:    { days: 365, colWidth: 40 }   // 年表示：月表示と同じ列幅(40px)に統一し、日付が詰まって見づらい課題を解消した（ガントチャートのZOOM_PRESETSと同じ対応）
}; // 「すべて」ズームはここには含めず、日数に応じて上記のいずれかの幅を動的に流用する

// ===== アプリの状態を保持する変数 =====
let folders = []; // フォルダーの配列（グルーピング専用・入れ子可）
let mainTasks = []; // メインタスクの配列（全体行＋マイルストーンを持つ）
let subTasks = []; // サブタスクの配列（期間バーを持つ実作業項目）
let detailTasks = []; // ディテールタスクの配列（サブタスクの子・階層打ち止め）
let milestones = []; // マイルストーンの配列（メインタスクに必須で紐づく）
let fileHandle = null; // 接続中のファイルハンドル
let pendingHandle = null; // 権限切れ等で再接続待ちになっているファイルハンドル（無ければnull）
let autosaveTimer = null; // 自動保存のデバウンス用タイマー
let currentView = 'list'; // 現在の表示モード（list / gantt / workload）
let ganttZoom = 'month'; // ガントチャートのズームレベル
let ganttViewStart = startOfDay(new Date()); // ガントチャート（日付ビュー）の表示開始日
let ganttHourDay = startOfDay(new Date()); // 日(時間)ビューで表示する日
let dragState = null; // ガントチャートのドラッグ操作の状態（ドラッグ中でなければnull）
let itemModalReturnTo = null; // itemModalを閉じた後に再度開くべき管理モーダルのid（無ければnull）
let folderItemModalReturnTo = false; // フォルダー追加・編集モーダルを閉じた後、フォルダー管理モーダル（一覧）へ戻るべきかどうか
let mainTaskItemModalReturnTo = false; // メインタスク追加・編集モーダルを閉じた後、メインタスク管理モーダル（一覧）へ戻るべきかどうか
let workloadViewStart = startOfDay(new Date()); // 業務余力ビューの表示開始日
let workloadMode = 'effort'; // 業務余力ビューの集計モード（count=タスク数ベース / effort=工数ベース）
let workloadZoom = 'month'; // ここから追加：業務余力ビューのズームレベル（week/month/quarter/year/all）。ガントチャートと同じ4段階に「すべて」を加えた5段階にする
let workloadThreshold = 3; // 業務余力ビューでアラート表示に使う閾値（起動時にlocalStorageの保存値があれば上書きされる）
let workloadAxisMax = null; // 業務余力ビューのY軸目盛り上限（閾値とは別に指定可能。null/未入力/0以下なら従来通り閾値から自動算出する。起動時にlocalStorageの保存値があれば上書きされる）
let selectedWorkloadDate = null; // 業務余力ビューでクリックして選択中の日付（未選択ならnull）

// ===== ガントチャートの行ドラッグ(移動・並び替え)用の状態 =====
let ganttDragSource = null; // ドラッグ中の行情報（{kind, id}）。ドラッグしていなければnull
let ganttOrderSeq = 0; // 手動並び順(order)の重複回避用連番。アプリ起動中だけ有効な一時カウンター
function nextOrder(){ return Date.now() * 1000 + (ganttOrderSeq++); } // 現在時刻と連番を組み合わせ、重複しないorder値を生成する

// ===== ズームレベルごとの表示日数と1日あたりの幅(px) =====
// ここを修正：month/quarter/yearのdays値はもう列数計算に直接使わなくなったため、参考値（従来の目安）である旨をコメントに明記した。実際の列数はgetGanttDateViewDays()が動的に算出する
const ZOOM_PRESETS = {
  week:    { days: 7,   colWidth: 90 }, // 週表示：月曜始まりの直近1週間を詳しく見る用（週は常に7日固定のためdaysの値をそのまま使い続ける）
  month:   { days: 30,  colWidth: 34 }, // 月表示：列幅の基準値として維持する。daysの値は31日ある月に対応できないため、実際の列数はgetGanttDateViewDays()で動的に算出する
  quarter: { days: 120, colWidth: 34 }, // 四半期表示：列幅の基準値として維持する。daysの値は実際の月日数を反映していないため、実際の列数はgetGanttDateViewDays()で動的に算出する
  year:    { days: 400, colWidth: 34 }  // 年表示：列幅の基準値として維持する。daysの値は実際の月日数を反映していないため、実際の列数はgetGanttDateViewDays()で動的に算出する
};

// ===== DOM要素のキャッシュ用オブジェクト =====
const els = {}; // 後でcacheEls()によって各IDのDOM要素が格納される
//----------------------------------------------------------------------------------------------------------------------------------------------------
//共有用変数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//共有用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== 日付ユーティリティ =====
function startOfDay(d){ const nd = new Date(d); nd.setHours(0,0,0,0); return nd; } // 時刻を切り捨てて日付だけにする
function toDateStr(d){ const y=d.getFullYear(); const m=String(d.getMonth()+1).padStart(2,'0'); const day=String(d.getDate()).padStart(2,'0'); return `${y}-${m}-${day}`; } // DateをYYYY-MM-DDに変換
function todayStr(){ return toDateStr(new Date()); } // 今日の日付文字列を返す
function addDays(d,n){ const nd = new Date(d); nd.setDate(nd.getDate()+n); return nd; } // n日後の日付を返す
function diffDays(a,b){ return Math.round((startOfDay(b) - startOfDay(a)) / 86400000); } // aからbまでの日数差を返す
function parseDateStr(s){ if(!s) return new Date(); const [y,m,d] = s.split('-').map(Number); return new Date(y, m-1, d); } // YYYY-MM-DDをDateに変換
function startOfWeekMonday(d){ const nd = startOfDay(d); const day = nd.getDay(); const diff = (day === 0 ? -6 : 1 - day); return addDays(nd, diff); } // 指定日を含む週の月曜日を返す（週の始まりを月曜にするための共通処理）
function getWeekdayInfo(d){ const weekdayNames = ['日','月','火','水','木','金','土']; return { text: weekdayNames[d.getDay()], isSat: d.getDay() === 6, isSun: d.getDay() === 0 }; } // 曜日の表示テキストと土日フラグをまとめて返す共通処理
function startOfMonth(d){ return new Date(d.getFullYear(), d.getMonth(), 1); } // 指定日を含む月の1日を返す（月表示の先頭列を揃えるための共通処理）
function startOfQuarter(d){ const qStartMonth = Math.floor(d.getMonth() / 3) * 3; return new Date(d.getFullYear(), qStartMonth, 1); } // 指定日を含む四半期（1-3月/4-6月/7-9月/10-12月のいずれか）の開始月の1日を返す
function startOfYear(d){ return new Date(d.getFullYear(), 0, 1); } // 指定日を含む年の1月1日を返す

// ===== 時間ユーティリティ =====
function timeStrToMinutes(t){ if(!t) return null; const [h, m] = t.split(':').map(Number); return h * 60 + m; } // "HH:MM"を分に変換
function minutesToTimeStr(min){ const clamped = Math.max(0, Math.min(24 * 60, min)); const h = Math.floor(clamped / 60).toString().padStart(2, '0'); const m = Math.floor(clamped % 60).toString().padStart(2, '0'); return `${h}:${m}`; } // 分を"HH:MM"に変換

// ===== 期間（periods）関連ユーティリティ =====
function periodsToString(periods){ return periods.map(p => `${p.start}:${p.end}`).join(';'); } // 期間配列を文字列化
function stringToPeriods(str){ if(!str) return []; return str.split(';').filter(Boolean).map(seg => { const [start, end] = seg.split(':'); return { start, end: end || start }; }); } // 文字列を期間配列に戻す
function periodTimesToString(periods){ return periods.map(p => (p.startTime && p.endTime) ? `${p.startTime}-${p.endTime}` : '').join(';'); } // 時間指定情報を文字列化
function stringToPeriodTimes(str){ if(!str) return []; return str.split(';').map(seg => { if(!seg) return null; const [startTime, endTime] = seg.split('-'); return { startTime, endTime }; }); } // 時間指定情報を配列に戻す
function getItemRange(item){ // サブタスク/ディテールタスク共通：計画の代表期間（最初の開始日〜最後の終了日）を求める
  if(!item.periods || item.periods.length === 0) return { start: todayStr(), end: todayStr() }; // 期間が無い場合は今日を仮の範囲とする
  let start = item.periods[0].start, end = item.periods[0].end; // 初期値は最初の期間にする
  for(const p of item.periods){ if(p.start < start) start = p.start; if(p.end > end) end = p.end; } // より広い範囲があれば更新する
  return { start, end }; // 代表期間を返す
}
function getItemActualRange(item){ // 実績期間の代表範囲（最初の開始日〜最後の終了日）を求める。実績が未記入ならnullを返す
  if(!item.actualPeriods || item.actualPeriods.length === 0) return null; // 実績が無ければ範囲も無い
  let start = item.actualPeriods[0].start, end = item.actualPeriods[0].end; // 初期値は最初の実績期間にする
  for(const p of item.actualPeriods){ if(p.start < start) start = p.start; if(p.end > end) end = p.end; } // より広い範囲があれば更新する
  return { start, end }; // 実績の代表期間を返す
}
function clonePeriodsArray(periods){ return periods.map(p => ({ start: p.start, end: p.end, startTime: p.startTime, endTime: p.endTime })); } // 期間配列を複製する（元の配列・オブジェクトと参照を共有しないようにする）
function applyActualDefaultsOnComplete(item){ // ステータスが完了の状態で実績が未記入なら、計画期間をそのまま実績として複製する共通処理
  if(item.status === '完了' && (!item.actualPeriods || item.actualPeriods.length === 0)){ item.actualPeriods = clonePeriodsArray(item.periods); } // 実績が空の場合のみ複製する（既に実績が入力済みなら上書きしない）
}
function toShortDateStr(dateStr){ if(!dateStr) return ''; const parts = dateStr.split('-'); if(parts.length !== 3) return dateStr; return `${parts[0].slice(2)}/${parts[1]}/${parts[2]}`; } // "YYYY-MM-DD"を"YY/MM/DD"に短縮する
function formatRangeShort(start, end){ return `${toShortDateStr(start)}~${toShortDateStr(end)}`; } // 短縮フォーマットの期間文字列"yy/mm/dd~yy/mm/dd"を組み立てる

// ===== 工数（人日）関連ユーティリティ =====
function getItemEffortPeriods(item){ // 工数の日数按分に使う「有効な期間」を1か所で決める共通処理（実績期間が入力済みならそれを優先し、無ければ計画期間を使う）
  return (item.actualPeriods && item.actualPeriods.length > 0) ? item.actualPeriods : item.periods; // getItemEffort()の自動計算と同じ優先順位に揃え、稼働日集合と工数の算出元が食い違わないようにする
}
function expandPeriodToWorkdays(period){ // 期間1件を「業務余力用の実働日」リストへ展開する共通処理（新設）
  const startD = parseDateStr(period.start); // 開始日をDate型に変換する
  const endD = parseDateStr(period.end); // 終了日をDate型に変換する
  const isSingleDay = period.start === period.end; // 単日指定かどうかを判定する（単日指定は意図的な稼働日として土日でも数える）
  const dates = []; // 実働日と判定した日付を格納する配列
  let d = startD; // 走査用の現在日（開始日から開始する）
  while(d <= endD){ // 開始日から終了日まで1日ずつ確認する
    const wd = getWeekdayInfo(d); // その日の曜日情報（土曜/日曜フラグ）を取得する
    if(isSingleDay || !(wd.isSat || wd.isSun)){ dates.push(toDateStr(d)); } // 単日指定、または平日（土日以外）の場合のみ実働日として採用する
    d = addDays(d, 1); // 次の日へ進める
  }
  return dates; // 実働日と判定した日付の配列を返す
}
function getItemActiveDatesSet(item){ // 有効な期間（実績優先・無ければ計画）を実働日展開して、そのタスクが稼働する日付(YYYY-MM-DD)の集合を作る（業務余力の集計に使う。複数日指定で週をまたいで巻き込まれた土日は除外し、単日指定の土日はそのまま含める）
  const set = new Set(); // 重複を除いた日付集合
  getItemEffortPeriods(item).forEach(p => { expandPeriodToWorkdays(p).forEach(dateStr => set.add(dateStr)); }); // getItemEffort()と同じ期間データ・同じ実働日判定を使い、稼働日集合を組み立てる
  return set; // 完成した日付集合を返す
}
function getItemEffort(item){ // 工数（人日）を返す。手入力があればそれを優先し、無ければ実績、実績も無ければ計画期間から「1日8時間」を基準に自動計算する
  if(typeof item.effort === 'number' && !isNaN(item.effort) && item.effort > 0) return item.effort; // 手入力の工数が有効な数値ならそれを使う
  const sourcePeriods = getItemEffortPeriods(item); // getItemActiveDatesSet()と全く同じ判定関数を使い、算出元の期間がズレないようにする
  let totalEffort = 0; // 合計工数（人日）
  sourcePeriods.forEach(p => { // 各期間を1つずつ工数へ変換して合算する
    const isSingleDay = p.start === p.end; // 単日指定かどうかを判定する
    if(isSingleDay && p.startTime && p.endTime){ // 単日かつ時間指定がある場合は時間から人日を算出する
      const minutes = Math.max(0, timeStrToMinutes(p.endTime) - timeStrToMinutes(p.startTime)); // 開始〜終了時刻の分数を求める
      totalEffort += minutes / (8 * 60); // 「1日8時間」を基準に分数を人日へ変換して加算する
    } else { // 時間指定が無い場合は実働日数をそのまま「1日8時間＝1人日」として加算する
      totalEffort += expandPeriodToWorkdays(p).length; // 実働日展開した日数分を加算する（複数日指定は巻き込まれた土日を除外、単日指定は土日でも1日として数える）
    }
  });
  return totalEffort > 0 ? totalEffort : 1; // 実働日が無い異常系（複数日指定が土日除外により0日になった場合を含む）では最低1人日とみなす
}
function getItemEffortHours(item){ // 工数を「時間(H)」単位で返す（業務余力ビューの工数ベース表示専用。内部の人日値に「1人日=8時間」を掛けて時間へ変換する）
  return getItemEffort(item) * 8; // getItemEffort()が返す人日値を、既存ロジックと同じ8時間/日の基準で時間へ変換する
}


// ===== データ正規化 =====
function normalizePeriods(basePeriods){ // 期間配列を安全な形に整える共通処理
  return basePeriods.map(p => { // 各期間を1つずつ正規化する
    const start = p.start; // 開始日
    const end = p.end || p.start; // 終了日省略時は開始日と同じにする
    const isSingleDay = start === end; // 単日判定
    const startTime = (isSingleDay && p.startTime) ? p.startTime : ''; // 単日以外は時刻を持たせない
    const endTime = (isSingleDay && p.endTime) ? p.endTime : ''; // 単日以外は時刻を持たせない
    return { start, end, startTime, endTime }; // 正規化済みの期間オブジェクトを返す
  });
}
function normalizeActualPeriods(basePeriods){ // 実績期間配列を安全な形に整える共通処理（未記入なら空配列のままにする）
  if(!basePeriods || basePeriods.length === 0) return []; // 実績が未記入の場合は空配列のままにする（計画期間のような自動補完はここでは行わない）
  return normalizePeriods(basePeriods); // 1件以上ある場合は計画期間と同じ正規化ルールを適用する
}
function normalizeEffort(rawEffort){ // 工数の入力値（文字列/数値/未定義）を安全な数値かnullに整える共通処理
  const parsed = (rawEffort === undefined || rawEffort === null || rawEffort === '') ? NaN : parseFloat(rawEffort); // 未入力ならNaN扱いにする
  return (!isNaN(parsed) && parsed > 0) ? parsed : null; // 有効な正の数値のみ採用し、それ以外はnull（自動計算に任せる）にする
}
function normalizeFolder(raw){ // フォルダーの正規化
  return {
    id: raw.id || ('folder-' + Date.now() + '-' + Math.random().toString(16).slice(2)), // IDが無ければ自動採番
    name: raw.name || raw.title || '(無題フォルダー)', // 名前が無ければ仮名
    parentFolderId: raw.parentFolderId || null, // 親フォルダー（ルートならnull）
    description: raw.description || '', // フォルダーの備考（任意入力）
    collapsed: !!raw.collapsed, // 折りたたみ状態
    order: (typeof raw.order === 'number' && !isNaN(raw.order)) ? raw.order : nextOrder(), // ガントチャートでの兄弟内表示順（ドラッグ&ドロップで変更可能）
    status: ['未着手','進行中','完了'].includes(raw.status) ? raw.status : '未着手' // フォルダーの完了状態（内部値はタスクと同じ'完了'。UI表示名のみ「クローズ」にする）
  };
}
function normalizeMainTask(raw){ // メインタスクの正規化
  return {
    id: raw.id || ('main-' + Date.now() + '-' + Math.random().toString(16).slice(2)), // IDが無ければ自動採番
    title: raw.title || '(無題メインタスク)', // タイトルが無ければ仮名
    folderId: raw.folderId || null, // 所属フォルダー（ルートならnull）
    description: raw.description || '', // メインタスクの備考（任意入力）
    collapsed: !!raw.collapsed, // サブタスク群の折りたたみ状態
    order: (typeof raw.order === 'number' && !isNaN(raw.order)) ? raw.order : nextOrder(), // ガントチャートでの兄弟内表示順（ドラッグ&ドロップで変更可能）
    status: ['未着手','進行中','完了'].includes(raw.status) ? raw.status : '未着手' // メインタスクの完了状態（内部値はタスクと同じ'完了'。UI表示名のみ「クローズ」にする）
  };
}
function normalizeSubTask(raw){ // サブタスクの正規化
  const basePeriods = (raw.periods && raw.periods.length > 0) ? raw.periods : [{ start: todayStr(), end: todayStr() }]; // 期間が無ければ本日1日を仮の期間にする
  return {
    id: raw.id || ('sub-' + Date.now() + '-' + Math.random().toString(16).slice(2)), // IDが無ければ自動採番
    title: raw.title || '(無題サブタスク)', // タイトルが無ければ仮名
    description: raw.description || '', // 備考
    periods: normalizePeriods(basePeriods), // 計画期間配列を正規化する
    actualPeriods: normalizeActualPeriods(raw.actualPeriods), // 実績期間配列を正規化する（未記入なら空配列のまま維持する）
    priority: ['高','中','低'].includes(raw.priority) ? raw.priority : '中', // 不正な優先度は中にする
    status: ['未着手','進行中','完了'].includes(raw.status) ? raw.status : '未着手', // 不正なステータスは未着手にする
    createdAt: raw.createdAt || new Date().toISOString(), // 作成日時
    updatedAt: raw.updatedAt || new Date().toISOString(), // 更新日時
    mainTaskId: raw.mainTaskId || null, // 親メインタスク（単独なら null）
    folderId: raw.folderId || null, // 単独運用時のみ意味を持つ所属フォルダー
    collapsed: !!raw.collapsed, // ディテールタスク群の折りたたみ状態
    ganttOnly: !!raw.ganttOnly, // ガントチャートのみに表示し、リスト表示には出さないかどうかのフラグ
    excludeFromWorkload: !!raw.excludeFromWorkload, // 業務余力ビューの集計対象から除外するかどうかのフラグ（trueなら稼働として数えない）
    order: (typeof raw.order === 'number' && !isNaN(raw.order)) ? raw.order : nextOrder(), // ガントチャートでの兄弟内表示順（ドラッグ&ドロップで変更可能）
    effort: normalizeEffort(raw.effort) // 工数(H)。未入力/不正値はnullにして自動計算に任せる
  };
}
function normalizeDetailTask(raw){ // ディテールタスクの正規化（サブタスクの子・階層打ち止め）
  const basePeriods = (raw.periods && raw.periods.length > 0) ? raw.periods : [{ start: todayStr(), end: todayStr() }]; // 期間が無ければ本日1日を仮の期間にする
  return {
    id: raw.id || ('detail-' + Date.now() + '-' + Math.random().toString(16).slice(2)), // IDが無ければ自動採番
    title: raw.title || '(無題ディテールタスク)', // タイトルが無ければ仮名
    description: raw.description || '', // 備考
    periods: normalizePeriods(basePeriods), // 計画期間配列を正規化する
    actualPeriods: normalizeActualPeriods(raw.actualPeriods), // 実績期間配列を正規化する（未記入なら空配列のまま維持する）
    priority: ['高','中','低'].includes(raw.priority) ? raw.priority : '中', // 不正な優先度は中にする
    status: ['未着手','進行中','完了'].includes(raw.status) ? raw.status : '未着手', // 不正なステータスは未着手にする
    createdAt: raw.createdAt || new Date().toISOString(), // 作成日時
    updatedAt: raw.updatedAt || new Date().toISOString(), // 更新日時
    subTaskId: raw.subTaskId || null, // 親サブタスク（必須想定）
    ganttOnly: !!raw.ganttOnly, // ガントチャートのみに表示し、リスト表示には出さないかどうかのフラグ
    excludeFromWorkload: !!raw.excludeFromWorkload, // 業務余力ビューの集計対象から除外するかどうかのフラグ（trueなら稼働として数えない）
    order: (typeof raw.order === 'number' && !isNaN(raw.order)) ? raw.order : nextOrder(), // ガントチャートでの兄弟内表示順（ドラッグ&ドロップで変更可能）
    effort: normalizeEffort(raw.effort) // 工数(H)。未入力/不正値はnullにして自動計算に任せる
  };
}
function normalizeMilestone(raw){ // マイルストーンの正規化（メインタスク必須）
  return {
    id: raw.id || ('mile-' + Date.now() + '-' + Math.random().toString(16).slice(2)), // IDが無ければ自動採番
    mainTaskId: raw.mainTaskId || null, // 紐づくメインタスク
    label: raw.label || raw.title || '(無題)', // ラベルが無ければ仮名
    date: raw.date || raw.milestoneDate || todayStr(), // 日付が無ければ今日にする
    shape: ['diamond','star','circle'].includes(raw.shape) ? raw.shape : 'diamond' // 不正な形状はダイヤにする
  };
}

// ===== HTMLエスケープ（表示時のXSS対策） =====
function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); } // 特殊文字をエスケープする

// ===== 階層パス表示ユーティリティ（リスト表示用） =====
function folderPath(folderId){ // フォルダーIDから祖先パス文字列を組み立てる（末尾に " > " を付与）
  if(!folderId) return ''; // フォルダー無しならパスも無し
  const f = folders.find(x => x.id === folderId); // 対象フォルダーを探す
  if(!f) return ''; // 見つからなければ空文字
  return folderPath(f.parentFolderId) + f.name + ' > '; // 親のパスに自分の名前を連結して再帰的に構築する
}
function ancestorPathOfSub(sub){ // サブタスクの所属パスを組み立てる
  if(sub.mainTaskId){ const mt = mainTasks.find(m => m.id === sub.mainTaskId); return mt ? (folderPath(mt.folderId) + mt.title + ' > ') : ''; } // メインタスク配下ならメインタスク名まで連結する
  if(sub.folderId){ return folderPath(sub.folderId); } // 単独フォルダー配下ならフォルダーパスのみ
  return ''; // ルート直下なら空文字
}
function ancestorPathOfDetail(detail){ // ディテールタスクの所属パスを組み立てる
  const sub = subTasks.find(s => s.id === detail.subTaskId); // 親サブタスクを探す
  return sub ? (ancestorPathOfSub(sub) + sub.title + ' > ') : ''; // 親サブタスクのパスに自分の親名を連結する
}
function trimTrailingArrow(path){ return path.replace(/ > $/, ''); } // パス文字列の末尾に残る" > "を取り除き、単独行で表示しても不自然にならないようにする

// ===== 上位階層クローズ・削除時の連動処理（フォルダー/メインタスク/サブタスク/ディテールタスク共通） =====
function cascadeDeleteSubTask(id){ detailTasks = detailTasks.filter(d => d.subTaskId !== id); subTasks = subTasks.filter(s => s.id !== id); } // サブタスク削除時に子のディテールタスクも削除する
function cascadeDeleteMainTask(id){ subTasks.filter(s => s.mainTaskId === id).forEach(s => cascadeDeleteSubTask(s.id)); milestones = milestones.filter(m => m.mainTaskId !== id); mainTasks = mainTasks.filter(m => m.id !== id); } // メインタスク削除時に配下すべてを削除する
function cascadeCompleteSubTask(subTaskId){ // サブタスクが完了になった際、配下のディテールタスクをすべて完了状態にする
  detailTasks.filter(d => d.subTaskId === subTaskId).forEach(d => { d.status = '完了'; applyActualDefaultsOnComplete(d); }); // 完了にしつつ、実績が未記入なら計画期間を複製する
}
function cascadeCompleteMainTask(mainTaskId){ // メインタスクがクローズされた際、配下のサブタスク（およびそのディテールタスク）を再帰的に完了状態にする
  subTasks.filter(s => s.mainTaskId === mainTaskId).forEach(s => { s.status = '完了'; applyActualDefaultsOnComplete(s); cascadeCompleteSubTask(s.id); }); // 完了にしつつ実績を複製し、さらに配下のディテールタスクへ再帰する
}
function cascadeCompleteFolder(folderId){ // フォルダーがクローズされた際、配下の子フォルダー・メインタスク・単独サブタスクを再帰的に完了状態にする
  folders.filter(f => f.parentFolderId === folderId).forEach(f => { f.status = '完了'; cascadeCompleteFolder(f.id); }); // 子フォルダーをクローズにしつつ、さらにその配下へ再帰する
  mainTasks.filter(m => m.folderId === folderId).forEach(m => { m.status = '完了'; cascadeCompleteMainTask(m.id); }); // 直下のメインタスクをクローズにしつつ、さらにその配下へ再帰する
  subTasks.filter(s => !s.mainTaskId && s.folderId === folderId).forEach(s => { s.status = '完了'; applyActualDefaultsOnComplete(s); cascadeCompleteSubTask(s.id); }); // 直下の単独サブタスクを完了にしつつ実績を複製し、さらにその配下へ再帰する
}

// ===== 汎用の絞り込み・並び替え共通処理（リスト/ガント/業務余力/各種管理モーダルで共用） =====
function matchesStatusSearchFilter(item, statusEl, searchEl){ // ステータス＋タイトル検索の絞り込み判定
  const statusFilter = statusEl.value; // 選択された絞り込み条件を取得する
  const search = searchEl.value.trim().toLowerCase(); // 検索文字列を取得する
  if(statusFilter === 'notDone' && item.status === '完了') return false; // 完了以外指定で完了なら除外する
  if(statusFilter !== 'all' && statusFilter !== 'notDone' && item.status !== statusFilter) return false; // 特定ステータス指定で不一致なら除外する
  if(search && !item.title.toLowerCase().includes(search)) return false; // 検索文字列に一致しなければ除外する
  return true; // それ以外は一致とみなす
}
function matchesFilter(item){ // ステータス絞り込みと検索文字列に一致するかを判定する
  const statusFilter = els.filterStatus.value; const search = els.searchBox.value.trim().toLowerCase(); // フィルター条件を取得する
  if(statusFilter === 'notDone' && item.status === '完了') return false; // 完了以外の絞り込みで完了なら除外する
  if(statusFilter !== 'all' && statusFilter !== 'notDone' && item.status !== statusFilter) return false; // 特定ステータス指定で不一致なら除外する
  if(search && !item.title.toLowerCase().includes(search)) return false; // 検索文字列に一致しなければ除外する
  return true; // それ以外は一致とみなす
}
function compareItems(a, b){ // 並び替えキーに応じて比較する
  const key = els.sortKey.value; // 並び替えキーを取得する
  if(key === 'priority') return (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9); // 優先度順
  if(key === 'createdAt') return new Date(a.createdAt) - new Date(b.createdAt); // 作成日時順
  const ra = getItemRange(a), rb = getItemRange(b); return ra.end.localeCompare(rb.end); // それ以外は代表終了日順
}

// ===== ドラッグ操作の共通ヘルパー =====
function showDragTooltip(x, y, text){ els.dragTooltip.textContent = text; els.dragTooltip.style.left = `${x}px`; els.dragTooltip.style.top = `${y - 28}px`; els.dragTooltip.hidden = false; } // ツールチップを表示する
function hideDragTooltip(){ els.dragTooltip.hidden = true; } // ツールチップを隠す

// ===== 備考表示用ツールチップの共通ヘルパー =====
function showDescTooltipNear(el, text){ // 指定要素の近くに備考ツールチップを表示する
  const rect = el.getBoundingClientRect(); // 対象要素の画面上の位置を取得する
  els.descTooltip.textContent = text; // 表示内容を備考テキストにする
  els.descTooltip.style.left = `${rect.left}px`; // 要素の左端に合わせる
  els.descTooltip.style.top = `${rect.bottom + 4}px`; // 要素の下側に少し離して配置する
  els.descTooltip.hidden = false; // ツールチップを表示する
}
function hideDescTooltip(){ els.descTooltip.hidden = true; } // 備考ツールチップを隠す

// ===== 表示モードの司令塔（リスト・ガント・業務余力の3ビューをまとめて扱う） =====
function renderAll(){ // リスト・ガント（表示中の場合）・業務余力（表示中の場合）をまとめて再描画する
  renderList(); // リスト表示は常に最新化しておく
  if(currentView === 'gantt') renderGanttSection(); // ガント表示中ならガントを再描画する
  else if(currentView === 'workload') renderWorkloadSection(); // 業務余力表示中なら業務余力を再描画する
}
function switchView(view){ // リスト/ガント/業務余力のタブを切り替える
  currentView = view; // 現在の表示モードを更新する
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.toggle('active', b.dataset.view === view)); // タブの選択状態を更新する
  els.viewList.hidden = view !== 'list'; els.viewGantt.hidden = view !== 'gantt'; els.viewWorkload.hidden = view !== 'workload'; // 対応するビューの表示/非表示を切り替える
  if(view === 'gantt') renderGanttSection(); // ガントに切り替えた場合は再描画する
  else if(view === 'workload') renderWorkloadSection(); // 業務余力に切り替えた場合も再描画する
}

// ===== ここを追加：月表示・四半期表示・年表示で「表示開始日が属する月」を基準に、実際のカレンダー日数から表示日数を動的に算出する関数 =====
// 従来はmonth=30日・quarter=120日・year=400日の固定値だったため、31日まである月では31日目の列が用意されず表示が途中で切れてしまっていた
// この関数は対象月の月末日までを実日数で数え、末尾に7日分のバッファ列を1回だけ加えることで、どの月でも月末まで正しく表示できるようにする
function getGanttDateViewDays(zoom, viewStart){
  if(zoom === 'week') return ZOOM_PRESETS.week.days; // 週表示は常に月曜始まりの7日固定なので、月をまたいでも31日問題は起きないためそのまま返す
  const monthsForwardByZoom = { month: 0, quarter: 2, year: 11 }; // 月表示は当月のみ(0か月先まで)、四半期表示は当月+2か月先まで(合計3か月分)、年表示は当月+11か月先まで(合計12か月分)を対象にする
  const monthsForward = monthsForwardByZoom[zoom] !== undefined ? monthsForwardByZoom[zoom] : 0; // 該当するズームが無い場合の保険として0か月先(当月のみ)を使う
  const targetMonthEnd = new Date(viewStart.getFullYear(), viewStart.getMonth() + monthsForward + 1, 0); // 対象の最終月の月末日を求める（日付部分を0にすると「前月の最終日」が得られるJSの仕様を利用している）
  const rawDays = diffDays(viewStart, targetMonthEnd) + 1 + 7; // 表示開始日から対象最終月の月末日までの実際の日数を求め、要望通り末尾に7日分のバッファを1回だけ加算する
  return Math.max(rawDays, 7); // 万一マイナス等の異常値になった場合に備え、最低でも7日は確保する安全策
}
//----------------------------------------------------------------------------------------------------------------------------------------------------
//共有用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//ファイル・データ永続化用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== CSV変換ロジック =====
function escapeCsvField(field){ const s = String(field ?? ''); if(/[",\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'; return s; } // CSVフィールドをエスケープする
function buildCSVText(){ // 5種のデータをまとめて1つのCSVテキストに変換する
  const lines = [CSV_HEADERS.join(',')]; // 先頭行はヘッダー
  for(const f of folders){ lines.push(['folder', f.id, f.parentFolderId || '', f.name, f.description || '', '', '', f.status, '', '', '', '', '', f.collapsed ? '1' : '0', '', f.order, '', '', '', ''].map(escapeCsvField).join(',')); } // 末尾4列（実績期間・実績時間・工数・業務余力除外フラグ）はフォルダーには存在しないため空欄にする
  for(const m of mainTasks){ lines.push(['mainTask', m.id, m.folderId || '', m.title, m.description || '', '', '', m.status, '', '', '', '', '', m.collapsed ? '1' : '0', '', m.order, '', '', '', ''].map(escapeCsvField).join(',')); } // 末尾4列はメインタスクにも存在しないため空欄にする
  for(const s of subTasks){ lines.push(['subTask', s.id, s.mainTaskId || s.folderId || '', s.title, s.description, periodsToString(s.periods), s.priority, s.status, s.createdAt, s.updatedAt, '', '', periodTimesToString(s.periods), s.collapsed ? '1' : '0', s.ganttOnly ? '1' : '0', s.order, periodsToString(s.actualPeriods), periodTimesToString(s.actualPeriods), s.effort != null ? s.effort : '', s.excludeFromWorkload ? '1' : '0'].map(escapeCsvField).join(',')); } // 末尾に実績期間・実績時間・工数・業務余力除外フラグを追記する
  for(const d of detailTasks){ lines.push(['detailTask', d.id, d.subTaskId || '', d.title, d.description, periodsToString(d.periods), d.priority, d.status, d.createdAt, d.updatedAt, '', '', periodTimesToString(d.periods), '', d.ganttOnly ? '1' : '0', d.order, periodsToString(d.actualPeriods), periodTimesToString(d.actualPeriods), d.effort != null ? d.effort : '', d.excludeFromWorkload ? '1' : '0'].map(escapeCsvField).join(',')); } // 末尾に実績期間・実績時間・工数・業務余力除外フラグを追記する
  for(const mi of milestones){ lines.push(['milestone', mi.id, mi.mainTaskId || '', mi.label, '', '', '', '', '', '', mi.date, mi.shape, '', '', '', '', '', '', '', ''].map(escapeCsvField).join(',')); } // 末尾4列はマイルストーンにも存在しないため空欄にする
  return lines.join('\r\n'); // 改行でつないで返す
}
function parseCSVText(text){ // シンプルなCSVパーサー（ダブルクォート・改行対応）
  const rows = []; let row = []; let field = ''; let inQuotes = false; // パース用の一時変数
  for(let i = 0; i < text.length; i++){ // 1文字ずつ処理する
    const c = text[i]; // 現在の文字
    if(inQuotes){ if(c === '"'){ if(text[i+1] === '"'){ field += '"'; i++; } else inQuotes = false; } else field += c; } // クォート内の処理
    else { if(c === '"') inQuotes = true; else if(c === ',') { row.push(field); field = ''; } else if(c === '\n') { row.push(field); rows.push(row); row = []; field = ''; } else if(c === '\r') {} else field += c; } // クォート外の処理
  }
  if(field.length > 0 || row.length > 0){ row.push(field); rows.push(row); } // 最後の行を追加する
  return rows.filter(r => r.length > 1 || (r.length === 1 && r[0] !== '')); // 空行を除去して返す
}
function resolveSubTaskParent(parentId, mainTasksArr, foldersArr){ // parentIdがメインタスクIDかフォルダーIDかを判定する
  if(!parentId) return { mainTaskId: null, folderId: null }; // 未指定ならルート扱い
  if(mainTasksArr.some(m => m.id === parentId)) return { mainTaskId: parentId, folderId: null }; // メインタスクIDと一致したらメインタスク配下
  if(foldersArr.some(f => f.id === parentId)) return { mainTaskId: null, folderId: parentId }; // フォルダーIDと一致したらフォルダー配下
  return { mainTaskId: null, folderId: null }; // 該当なし（孤立）はルート扱いにする
}
function csvRowsToData(rows){ // 新形式(5種別)・旧形式(v2 task/milestone)・旧旧形式(startDate/dueDate)をすべて読み込む
  if(rows.length === 0) return { folders: [], mainTasks: [], subTasks: [], detailTasks: [], milestones: [] }; // 空なら全て空配列を返す
  const header = rows[0].map(h => h.trim()); // ヘッダー行を取得する
  const dataRows = rows.slice(1); // データ本体の行
  const idx = name => header.indexOf(name); // 列名から列番号を求めるヘルパー
  const get = (r, name) => (idx(name) >= 0 ? (r[idx(name)] ?? '') : ''); // 行と列名から値を取得するヘルパー
  const newFolders = [], newMainTasks = [], newSubTasks = [], newDetailTasks = [], newMilestones = []; // 読み込み結果を格納する配列
  if(idx('type') >= 0 && idx('parentId') >= 0){ // 新形式（5種別・parentId列あり）
    const getOrder = r => { const v = get(r,'order'); return v !== '' ? Number(v) : undefined; }; // order列を数値として取得する（無ければundefinedにしてnormalize側の自動採番に任せる）
    dataRows.filter(r => get(r,'type') === 'folder').forEach(r => newFolders.push(normalizeFolder({ id: get(r,'id'), name: get(r,'title'), parentFolderId: get(r,'parentId') || null, description: get(r,'description'), collapsed: get(r,'collapsed') === '1', order: getOrder(r), status: get(r,'status') }))); // フォルダー行の備考・order・statusを復元する
    dataRows.filter(r => get(r,'type') === 'mainTask').forEach(r => newMainTasks.push(normalizeMainTask({ id: get(r,'id'), title: get(r,'title'), folderId: get(r,'parentId') || null, description: get(r,'description'), collapsed: get(r,'collapsed') === '1', order: getOrder(r), status: get(r,'status') }))); // メインタスク行の備考・order・statusを復元する
    dataRows.filter(r => get(r,'type') === 'subTask').forEach(r => { // サブタスク行を読み込む
      const { mainTaskId, folderId } = resolveSubTaskParent(get(r,'parentId'), newMainTasks, newFolders); // 親の種類を判定する
      const rawPeriods = stringToPeriods(get(r,'periods')); // 計画期間（日付部分）を取得する
      const rawTimes = stringToPeriodTimes(get(r,'periodTimes')); // 計画期間の時間指定部分を取得する
      const merged = rawPeriods.map((p,i) => ({ start: p.start, end: p.end, startTime: rawTimes[i] ? rawTimes[i].startTime : '', endTime: rawTimes[i] ? rawTimes[i].endTime : '' })); // 計画期間と計画時間を結合する
      const rawActualPeriods = stringToPeriods(get(r,'actualPeriods')); // 実績期間（日付部分）を取得する
      const rawActualTimes = stringToPeriodTimes(get(r,'actualPeriodTimes')); // 実績期間の時間指定部分を取得する
      const mergedActual = rawActualPeriods.map((p,i) => ({ start: p.start, end: p.end, startTime: rawActualTimes[i] ? rawActualTimes[i].startTime : '', endTime: rawActualTimes[i] ? rawActualTimes[i].endTime : '' })); // 実績期間と実績時間を結合する
      newSubTasks.push(normalizeSubTask({ id: get(r,'id'), title: get(r,'title'), description: get(r,'description'), periods: merged, actualPeriods: mergedActual, priority: get(r,'priority'), status: get(r,'status'), createdAt: get(r,'createdAt'), updatedAt: get(r,'updatedAt'), mainTaskId, folderId, collapsed: get(r,'collapsed') === '1', ganttOnly: get(r,'ganttOnly') === '1', excludeFromWorkload: get(r,'excludeFromWorkload') === '1', order: getOrder(r), effort: get(r,'effort') })); // 工数列・業務余力除外フラグ列を含めて復元する
    });
    dataRows.filter(r => get(r,'type') === 'detailTask').forEach(r => { // ディテールタスク行を読み込む
      const rawPeriods = stringToPeriods(get(r,'periods')); // 計画期間（日付部分）を取得する
      const rawTimes = stringToPeriodTimes(get(r,'periodTimes')); // 計画期間の時間指定部分を取得する
      const merged = rawPeriods.map((p,i) => ({ start: p.start, end: p.end, startTime: rawTimes[i] ? rawTimes[i].startTime : '', endTime: rawTimes[i] ? rawTimes[i].endTime : '' })); // 計画期間と計画時間を結合する
      const rawActualPeriods = stringToPeriods(get(r,'actualPeriods')); // 実績期間（日付部分）を取得する
      const rawActualTimes = stringToPeriodTimes(get(r,'actualPeriodTimes')); // 実績期間の時間指定部分を取得する
      const mergedActual = rawActualPeriods.map((p,i) => ({ start: p.start, end: p.end, startTime: rawActualTimes[i] ? rawActualTimes[i].startTime : '', endTime: rawActualTimes[i] ? rawActualTimes[i].endTime : '' })); // 実績期間と実績時間を結合する
      newDetailTasks.push(normalizeDetailTask({ id: get(r,'id'), title: get(r,'title'), description: get(r,'description'), periods: merged, actualPeriods: mergedActual, priority: get(r,'priority'), status: get(r,'status'), createdAt: get(r,'createdAt'), updatedAt: get(r,'updatedAt'), subTaskId: get(r,'parentId') || null, ganttOnly: get(r,'ganttOnly') === '1', excludeFromWorkload: get(r,'excludeFromWorkload') === '1', order: getOrder(r), effort: get(r,'effort') })); // 工数列・業務余力除外フラグ列を含めて復元する
    });
    dataRows.filter(r => get(r,'type') === 'milestone').forEach(r => newMilestones.push(normalizeMilestone({ id: get(r,'id'), mainTaskId: get(r,'parentId') || null, label: get(r,'title'), date: get(r,'milestoneDate'), shape: get(r,'milestoneShape') }))); // マイルストーン行を読み込む
  } else if(idx('type') >= 0){ // 旧形式v2（task/milestoneのみ、parentId無し）：すべて単独サブタスクとして移行する
    for(const r of dataRows){ // 各行を処理する
      if(get(r,'type') === 'milestone'){ newMilestones.push(normalizeMilestone({ id: get(r,'id'), mainTaskId: null, label: get(r,'title'), date: get(r,'milestoneDate'), shape: get(r,'milestoneShape') })); } // マイルストーンは所属未定として読み込む
      else { // タスク行は単独サブタスクとして読み込む
        const rawPeriods = stringToPeriods(get(r,'periods')); // 日付部分の期間配列
        const rawTimes = stringToPeriodTimes(get(r,'periodTimes')); // 時間指定部分の配列
        const merged = rawPeriods.map((p,i) => ({ start: p.start, end: p.end, startTime: rawTimes[i] ? rawTimes[i].startTime : '', endTime: rawTimes[i] ? rawTimes[i].endTime : '' })); // 結合する
        newSubTasks.push(normalizeSubTask({ id: get(r,'id'), title: get(r,'title'), description: get(r,'description'), periods: merged, priority: get(r,'priority'), status: get(r,'status'), createdAt: get(r,'createdAt'), updatedAt: get(r,'updatedAt') })); // 単独サブタスクとして追加する（実績期間・工数は未指定なので既定値になる）
      }
    }
  } else { // 旧旧形式（startDate, dueDateのみ）
    for(const r of dataRows){ const obj = {}; header.forEach((h,i) => obj[h] = r[i]); newSubTasks.push(normalizeSubTask({ id: obj.id, title: obj.title, description: obj.description, periods: [{ start: obj.startDate, end: obj.dueDate }], priority: obj.priority, status: obj.status, createdAt: obj.createdAt, updatedAt: obj.updatedAt })); } // 単一期間の単独サブタスクとして読み込む
  }
  return { folders: newFolders, mainTasks: newMainTasks, subTasks: newSubTasks, detailTasks: newDetailTasks, milestones: newMilestones }; // 読み込んだ5種のデータを返す
}

// ===== IndexedDBヘルパー（ファイルハンドル永続化用） =====
function openDB(){ return new Promise((resolve, reject) => { const req = indexedDB.open(DB_NAME, DB_VERSION); req.onupgradeneeded = () => { req.result.createObjectStore(STORE_NAME); }; req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); } // DBを開く
async function idbSet(key, value){ const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, 'readwrite'); tx.objectStore(STORE_NAME).put(value, key); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); } // 値を保存する
async function idbGet(key){ const db = await openDB(); return new Promise((resolve, reject) => { const tx = db.transaction(STORE_NAME, 'readonly'); const req = tx.objectStore(STORE_NAME).get(key); req.onsuccess = () => resolve(req.result); req.onerror = () => reject(req.error); }); } // 値を取得する

// ===== ファイル操作関連 =====
async function hasPermission(handle){ // 権限の"確認のみ"を行う関数（自動実行される処理専用・requestPermissionは呼ばない）
  const opts = { mode: 'readwrite' }; // 読み書き権限を対象にする
  return (await handle.queryPermission(opts)) === 'granted'; // 現状の許可状態だけを見て真偽値を返す
} // ここまでhasPermission
async function verifyPermission(handle){ // 権限の"確認＋必要なら要求"を行う関数（ユーザークリック直後の処理専用）
  const opts = { mode: 'readwrite' }; // 読み書き権限を対象にする
  if((await handle.queryPermission(opts)) === 'granted') return true; // すでに許可済みなら true を返す
  if((await handle.requestPermission(opts)) === 'granted') return true; // 未許可ならユーザーに許可を要求する（クリック直後限定で成功する）
  return false; // どちらも許可されなければ false を返す
} // ここまでverifyPermission
async function connectFile(){ // 新規にCSVファイルを開く/作成する（ボタンクリックから呼ばれるため権限まわりは変更不要）
  if(!FS_SUPPORTED){ alert('このブラウザはファイル直接保存に対応していません。手動エクスポート/インポートをご利用ください。'); return; } // 非対応ブラウザは案内して終了する
  try{ // エラーを捕捉するためtryで囲む
    const [handle] = await window.showOpenFilePicker({ types: FILE_TYPES }); // ファイル選択ダイアログを開く
    fileHandle = handle; // 選択されたハンドルを保持する
    pendingHandle = null; // 新規接続できたので再接続待ち状態は解除する
    await idbSet(HANDLE_KEY, handle); // 次回起動時に復元できるよう保存する
    await loadFromFileHandle(); // 選択したファイルの内容を読み込む
    updateFileStatus(); // 接続状態の表示を更新する
  }catch(err){ if(err.name !== 'AbortError'){ console.error(err); alert('ファイルの接続に失敗しました: ' + err.message); } } // キャンセル以外のエラーは通知する
} // ここまでconnectFile
async function loadFromFileHandle(){ // 接続済みハンドルからCSVを読み込む
  try{ // エラーを捕捉するためtryで囲む
    const file = await fileHandle.getFile(); // ファイルオブジェクトを取得する
    const text = await file.text(); // テキストとして読み込む
    const data = csvRowsToData(parseCSVText(text)); // CSVを解析して5種のデータに変換する
    folders = data.folders; mainTasks = data.mainTasks; subTasks = data.subTasks; detailTasks = data.detailTasks; milestones = data.milestones; // 各配列を更新する
    persistLocal(); // localStorageにも反映する
    renderAll(); // 画面を再描画する
  }catch(err){ console.error(err); } // 失敗時はコンソールに出力する
} // ここまでloadFromFileHandle
async function tryRestoreHandle(){ // 起動時に前回接続したファイルハンドルの復元を試みる（自動実行のためrequestPermissionは呼ばない）
  try{ // エラーを捕捉するためtryで囲む
    const handle = await idbGet(HANDLE_KEY); // IndexedDBから保存済みハンドルを取得する
    if(handle && await hasPermission(handle)){ // ハンドルがあり、かつ許可がまだ有効な場合のみ
      fileHandle = handle; // 接続中のハンドルとして確定する
      await loadFromFileHandle(); // ファイルの内容を読み込む
    } else if(handle){ // ハンドルはあるが許可が切れている、または未許可の場合
      pendingHandle = handle; // 再接続ボタン用に保持しておく（ここではrequestPermissionを呼ばない）
    } // ハンドルが無ければ何もしない
  }catch(err){ console.error(err); } // 失敗時はコンソールに出力する
  updateFileStatus(); // 接続状態の表示を更新する
} // ここまでtryRestoreHandle
async function reconnectFile(){ // 権限が切れた場合の再接続ボタン用処理（クリック起点なのでrequestPermissionを呼んでよい）
  const handle = pendingHandle || await idbGet(HANDLE_KEY); // 保持中の再接続待ちハンドル、無ければIndexedDBから取得する
  if(!handle){ alert('接続履歴がありません。「CSVファイルを開く/作成」から接続してください。'); return; } // 履歴が無ければ案内して終了する
  if(await verifyPermission(handle)){ // クリック直後なのでここでのみrequestPermissionが許可される
    fileHandle = handle; // 許可されたのでハンドルを確定する
    pendingHandle = null; // 再接続待ち状態を解除する
    await loadFromFileHandle(); // ファイルの内容を読み込む
    updateFileStatus(); // 表示を更新する
  } else { alert('権限が許可されませんでした。'); } // 許可されなければ通知する
} // ここまでreconnectFile
function updateFileStatus(){ // 接続状態の文言を更新する
  if(fileHandle){ els.fileStatus.textContent = `保存先: ${fileHandle.name} に接続中（自動保存）`; } // 接続中はファイル名を表示する
  else if(pendingHandle){ els.fileStatus.textContent = `保存先: ${pendingHandle.name} への接続が切れています。ファイル操作の「タスク管理ファイルへ再接続」ボタンを押してください。`; } // 再接続待ちの案内を表示する
  else { els.fileStatus.textContent = '保存先: 未接続（ブラウザ内に一時保存中）'; } // 未接続時の表示
} // ここまでupdateFileStatus
function persistLocal(){ // localStorageへ5種のデータをまとめて保存する
  localStorage.setItem(LS_FOLDERS_KEY, JSON.stringify(folders)); // フォルダーを保存する
  localStorage.setItem(LS_MAINTASKS_KEY, JSON.stringify(mainTasks)); // メインタスクを保存する
  localStorage.setItem(LS_SUBTASKS_KEY, JSON.stringify(subTasks)); // サブタスクを保存する
  localStorage.setItem(LS_DETAILTASKS_KEY, JSON.stringify(detailTasks)); // ディテールタスクを保存する
  localStorage.setItem(LS_MILESTONES_KEY, JSON.stringify(milestones)); // マイルストーンを保存する
} // ここまでpersistLocal
function scheduleSave(){ persistLocal(); clearTimeout(autosaveTimer); autosaveTimer = setTimeout(saveToFileIfConnected, 500); } // データ変更のたびにローカル保存し、少し待ってからファイルへ書き込む
async function saveToFileIfConnected(){ // 接続中のファイルへCSVを自動書き込みする（タイマー起点のためrequestPermissionは呼ばない）
  if(!fileHandle) return; // 未接続なら何もしない
  try{ // エラーを捕捉するためtryで囲む
    if(!(await hasPermission(fileHandle))){ // 許可が切れていた場合（ここでrequestPermissionは呼ばない）
      pendingHandle = fileHandle; // 再接続待ちハンドルとして退避する
      fileHandle = null; // 自動保存を止めるため接続状態を解除する
      updateFileStatus(); // 再接続を促す表示に切り替える
      return; // 書き込みを中止する
    } // 許可切れチェックここまで
    const writable = await fileHandle.createWritable(); // 書き込み用ストリームを取得する
    await writable.write(buildCSVText()); // 最新のCSVテキストを書き込む
    await writable.close(); // ストリームを閉じて保存を確定する
  }catch(err){ console.error(err); } // 失敗時はコンソールに出力する
} // ここまでsaveToFileIfConnected
function exportCSVManual(){ const blob = new Blob([buildCSVText()], { type: 'text/csv;charset=utf-8;' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'TMS_Data.csv'; a.click(); URL.revokeObjectURL(url); } // 手動ダウンロードを行う
function importCSVFile(file){ // 手動インポートを行う
  const reader = new FileReader(); // ファイル読み込み用オブジェクト
  reader.onload = () => { const data = csvRowsToData(parseCSVText(reader.result)); folders = data.folders; mainTasks = data.mainTasks; subTasks = data.subTasks; detailTasks = data.detailTasks; milestones = data.milestones; scheduleSave(); renderAll(); }; // 読み込み完了時にデータを反映する
  reader.readAsText(file, 'UTF-8'); // UTF-8として読み込む
}
//----------------------------------------------------------------------------------------------------------------------------------------------------
//ファイル・データ永続化用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//モーダル管理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== モーダルの排他制御（同時に複数開かないようにする） =====
function closeAllModals(){ // 開いている可能性のあるモーダルをすべて閉じる
  els.itemModalOverlay.hidden = true; // タスク（サブ/ディテール）追加・編集モーダルを閉じる
  els.folderModalOverlay.hidden = true; // フォルダー管理モーダルを閉じる
  els.folderItemModalOverlay.hidden = true; // フォルダー追加・編集モーダルを閉じる
  els.mainTaskModalOverlay.hidden = true; // メインタスク管理モーダルを閉じる
  els.mainTaskItemModalOverlay.hidden = true; // メインタスク追加・編集モーダルを閉じる
  els.subTaskModalOverlay.hidden = true; // サブタスク管理モーダルを閉じる
  els.detailTaskModalOverlay.hidden = true; // ディテールタスク管理モーダルを閉じる
  els.milestoneModalOverlay.hidden = true; // マイルストーン管理モーダルを閉じる
  els.milestoneItemModalOverlay.hidden = true; // マイルストーン追加・編集モーダルを閉じる
  els.fileModalOverlay.hidden = true; // ファイル操作モーダルを閉じる
  els.helpModalOverlay.hidden = true; // ヘルプモーダルを閉じる
}

// ===== ヘルプモーダル（機能説明） =====
function openHelpModal(){ closeAllModals(); els.helpModalOverlay.hidden = false; } // 他のモーダルを閉じてからヘルプを開く
function closeHelpModal(){ els.helpModalOverlay.hidden = true; } // ヘルプモーダルを閉じる

// ===== フォルダー管理モーダル（一覧＋絞り込み＋追加導線） =====
function collectFolderAndDescendants(id){ // 指定フォルダー自身＋子孫フォルダーのIDをすべて収集する
  let ids = [id]; let changed = true; // 収集済みIDと変化フラグ
  while(changed){ changed = false; folders.forEach(f => { if(ids.includes(f.parentFolderId) && !ids.includes(f.id)){ ids.push(f.id); changed = true; } }); } // 変化が無くなるまで子孫を追加していく
  return ids; // 収集結果を返す
}
function populateFolderSelect(selectEl, excludeIds){ // フォルダー選択用<select>を階層インデント付きで再構築する
  selectEl.innerHTML = '<option value="">ルート</option>'; // ルート選択肢を先頭に追加する
  function walk(parentId, depth){ // 指定親の子フォルダーを再帰的にたどる
    folders.filter(f => f.parentFolderId === parentId).forEach(f => { // 該当する子フォルダーを1つずつ処理する
      if(excludeIds && excludeIds.includes(f.id)) return; // 自分自身・子孫は選べないようにする
      const opt = document.createElement('option'); opt.value = f.id; opt.textContent = '　'.repeat(depth) + f.name; selectEl.appendChild(opt); // 選択肢を追加する
      walk(f.id, depth + 1); // さらに深い階層をたどる
    });
  }
  walk(null, 0); // ルートから開始する
}
function matchesFolderFilter(f){ // フォルダー一覧の絞り込み判定（ステータス＋名前検索）
  const statusFilter = els.folderFilterStatus.value; // 選択された絞り込み条件を取得する
  const search = els.folderSearchBox.value.trim().toLowerCase(); // 検索文字列を取得する
  if(statusFilter === 'notDone' && f.status === '完了') return false; // 完了以外指定でクローズ済みなら除外する
  if(statusFilter !== 'all' && statusFilter !== 'notDone' && f.status !== statusFilter) return false; // 特定ステータス指定で不一致なら除外する
  if(search && !f.name.toLowerCase().includes(search)) return false; // 検索文字列に一致しなければ除外する
  return true; // それ以外は一致とみなす
}
function openFolderModal(){ // フォルダー管理モーダル（一覧＋絞り込み＋追加ボタン）を開く
  closeAllModals(); // 他のモーダルを閉じる
  renderFolderList(); // 絞り込み条件に従って一覧を再描画する
  els.folderModalOverlay.hidden = false; // モーダルを表示する
}
function closeFolderModal(){ els.folderModalOverlay.hidden = true; } // フォルダー管理モーダルを閉じる
function openFolderModalForEdit(folderId){ // ガント右クリックから、指定フォルダーを編集状態で直接開く
  const f = folders.find(x => x.id === folderId); // 対象フォルダーを取得する
  if(!f) return; // 見つからなければ何もしない
  openFolderItemModal(f, false); // 一覧を経由していないため、戻り先なし(false)でフォルダー追加・編集モーダルを開く
}
function renderFolderList(){ // フォルダー一覧を描画する（絞り込み・検索を適用する）
  els.folderListContainer.innerHTML = ''; // 一旦クリアする
  const list = folders.filter(matchesFolderFilter); // 絞り込み条件に一致するフォルダーだけを抽出する
  if(list.length === 0){ els.folderListContainer.innerHTML = '<p class="empty-message">該当するフォルダーはありません。</p>'; return; } // 該当なしの場合は案内表示する
  list.forEach(f => { // 抽出したフォルダーを1つずつ表示する
    const row = document.createElement('div'); row.className = 'milestone-item'; // 1行分の要素を作成する
    const closedBadge = f.status === '完了' ? '<span class="badge-closed">クローズ</span>' : ''; // クローズ済みフォルダーに付ける印
    row.innerHTML = `<span class="m-label" title="${escapeHtml(f.description || '')}">📁 ${escapeHtml(folderPath(f.parentFolderId))}${escapeHtml(f.name)}${closedBadge}</span>`; // 末尾にクローズバッジを連結する
    const editBtn = document.createElement('button'); editBtn.className = 'btn btn-small'; editBtn.textContent = '編集'; // 編集ボタンを作成する
    editBtn.addEventListener('click', () => openFolderItemModal(f, true)); // 一覧経由なので、閉じた後は一覧へ戻る(true)ようにして専用の追加・編集モーダルを開く
    const delBtn = document.createElement('button'); delBtn.className = 'btn btn-small btn-danger'; delBtn.textContent = '削除'; // 削除ボタンを作成する
    delBtn.addEventListener('click', () => deleteFolderById(f.id)); // 削除処理を呼ぶ
    row.appendChild(editBtn); row.appendChild(delBtn); // ボタンを行に追加する
    els.folderListContainer.appendChild(row); // 一覧に追加する
  });
}
function openFolderItemModal(folder, returnToList){ // フォルダー追加・編集モーダルを開く（folder省略時は新規追加、returnToListは閉じた後に一覧へ戻るかどうか）
  folderItemModalReturnTo = !!returnToList; // 戻り先情報を保存する（true以外はすべて戻らない扱いにする）
  closeAllModals(); // 他のモーダルを閉じる
  els.folderItemFormError.hidden = true; // エラー表示を隠す
  if(folder){ // 編集モードの場合
    els.folderItemModalTitle.textContent = 'フォルダーを編集'; // タイトルを変更する
    els.folderId.value = folder.id; // IDをセットする
    els.folderName.value = folder.name; // 名前をセットする
    populateFolderSelect(els.folderParentSelect, collectFolderAndDescendants(folder.id)); // 自分自身・子孫を除外して親候補を構築する
    els.folderParentSelect.value = folder.parentFolderId || ''; // 親フォルダーをセットする
    els.folderDescription.value = folder.description || ''; // 備考をセットする
    els.folderStatus.value = folder.status; // ステータスをセットする
  } else { // 新規追加モードの場合
    els.folderItemModalTitle.textContent = 'フォルダーを追加'; // タイトルを変更する
    els.folderId.value = ''; // IDを空にする
    els.folderName.value = ''; // 名前を空にする
    populateFolderSelect(els.folderParentSelect, null); // 親候補を全件で構築する
    els.folderParentSelect.value = ''; // 親未選択にする
    els.folderDescription.value = ''; // 備考を空にする
    els.folderStatus.value = '未着手'; // ステータスを初期値にする
  }
  els.folderItemModalOverlay.hidden = false; // モーダルを表示する
}
function closeFolderItemModal(){ // フォルダー追加・編集モーダルを閉じる（戻り先情報がある場合のみフォルダー管理モーダルへ戻る）
  if(els.folderItemModalOverlay.hidden) return; // 既に閉じている場合は何もしない
  els.folderItemModalOverlay.hidden = true; // 追加・編集モーダルを閉じる
  if(folderItemModalReturnTo) openFolderModal(); // 一覧経由で開いていた場合のみフォルダー管理モーダル（一覧）を再度開く
  folderItemModalReturnTo = false; // 戻り先情報をリセットする
}
function saveFolderItem(){ // フォルダー追加・編集モーダルの保存ボタン押下時の処理
  const name = els.folderName.value.trim(); // 入力された名前を取得する
  if(!name){ els.folderItemFormError.textContent = '名前を入力してください。'; els.folderItemFormError.hidden = false; return; } // 未入力ならエラー表示する
  const parentFolderId = els.folderParentSelect.value || null; // 親フォルダーIDを取得する
  const description = els.folderDescription.value.trim(); // 備考を取得する
  const status = els.folderStatus.value; // ステータスを取得する
  const id = els.folderId.value; // 編集対象のIDを取得する
  const existing = id ? folders.find(f => f.id === id) : null; // 編集対象の更新前データを取得する
  const prevStatus = existing ? existing.status : null; // 更新前のステータスを控える
  let savedId = id; // 保存後に確定するフォルダーIDを保持する
  if(id){ const idx = folders.findIndex(f => f.id === id); if(idx >= 0) folders[idx] = normalizeFolder({ ...folders[idx], name, parentFolderId, description, status }); } // 既存フォルダーを更新する
  else { const created = normalizeFolder({ name, parentFolderId, description, status }); folders.push(created); savedId = created.id; } // 新規フォルダーを追加する
  if(status === '完了' && prevStatus !== '完了'){ cascadeCompleteFolder(savedId); } // 未完了→クローズに変わった瞬間だけ配下すべてを連動して完了にする
  scheduleSave(); // 保存する
  closeFolderItemModal(); // モーダルを閉じる（戻り先があればフォルダー管理モーダルへ戻る）
  renderAll(); // ガント等を再描画する
}
function deleteFolderById(id){ // フォルダー削除時の処理
  if(!confirm('このフォルダーと配下のすべてのメインタスク/サブタスク/ディテールタスク/マイルストーンを削除しますか？')) return; // 確認を取る
  const toDelete = collectFolderAndDescendants(id); // 自身＋子孫フォルダーのID一覧を求める
  mainTasks.filter(m => toDelete.includes(m.folderId)).forEach(m => cascadeDeleteMainTask(m.id)); // 配下フォルダーのメインタスクを削除する
  subTasks.filter(s => !s.mainTaskId && toDelete.includes(s.folderId)).forEach(s => cascadeDeleteSubTask(s.id)); // 配下フォルダーの単独サブタスクを削除する
  folders = folders.filter(f => !toDelete.includes(f.id)); // フォルダー自身を削除する
  scheduleSave(); renderFolderList(); renderMainTaskList(); renderAll(); // 保存・再描画を行う
}

// ===== メインタスク管理モーダル（一覧＋絞り込み＋追加導線） =====
function matchesMainTaskFilter(m){ // メインタスク一覧の絞り込み判定（ステータス＋タイトル検索）
  const statusFilter = els.mainTaskFilterStatus.value; // 選択された絞り込み条件を取得する
  const search = els.mainTaskSearchBox.value.trim().toLowerCase(); // 検索文字列を取得する
  if(statusFilter === 'notDone' && m.status === '完了') return false; // 完了以外指定でクローズ済みなら除外する
  if(statusFilter !== 'all' && statusFilter !== 'notDone' && m.status !== statusFilter) return false; // 特定ステータス指定で不一致なら除外する
  if(search && !m.title.toLowerCase().includes(search)) return false; // 検索文字列に一致しなければ除外する
  return true; // それ以外は一致とみなす
}
function openMainTaskModal(){ // メインタスク管理モーダル（一覧＋絞り込み＋追加ボタン）を開く
  closeAllModals(); // 他のモーダルを閉じる
  renderMainTaskList(); // 絞り込み条件に従って一覧を再描画する
  els.mainTaskModalOverlay.hidden = false; // モーダルを表示する
}
function closeMainTaskModal(){ els.mainTaskModalOverlay.hidden = true; } // メインタスク管理モーダルを閉じる
function openMainTaskModalForEdit(mainTaskId){ // ガント右クリックから、指定メインタスクを編集状態で直接開く
  const m = mainTasks.find(x => x.id === mainTaskId); // 対象メインタスクを取得する
  if(!m) return; // 見つからなければ何もしない
  openMainTaskItemModal(m, false); // 一覧を経由していないため、戻り先なし(false)でメインタスク追加・編集モーダルを開く
}
function renderMainTaskList(){ // メインタスク一覧を描画する（絞り込み・検索を適用する）
  els.mainTaskListContainer.innerHTML = ''; // 一旦クリアする
  const list = mainTasks.filter(matchesMainTaskFilter); // 絞り込み条件に一致するメインタスクだけを抽出する
  if(list.length === 0){ els.mainTaskListContainer.innerHTML = '<p class="empty-message">該当するメインタスクはありません。</p>'; return; } // 該当なしの場合は案内表示する
  list.forEach(m => { // 抽出したメインタスクを1つずつ表示する
    const row = document.createElement('div'); row.className = 'milestone-item'; // 1行分の要素を作成する
    const closedBadge = m.status === '完了' ? '<span class="badge-closed">クローズ</span>' : ''; // クローズ済みメインタスクに付ける印
    row.innerHTML = `<span class="m-label" title="${escapeHtml(m.description || '')}">${escapeHtml(folderPath(m.folderId))}${escapeHtml(m.title)}${closedBadge}</span>`; // 末尾にクローズバッジを連結する
    const editBtn = document.createElement('button'); editBtn.className = 'btn btn-small'; editBtn.textContent = '編集'; // 編集ボタンを作成する
    editBtn.addEventListener('click', () => openMainTaskItemModal(m, true)); // 一覧経由なので、閉じた後は一覧へ戻る(true)ようにして専用の追加・編集モーダルを開く
    const delBtn = document.createElement('button'); delBtn.className = 'btn btn-small btn-danger'; delBtn.textContent = '削除'; // 削除ボタンを作成する
    delBtn.addEventListener('click', () => deleteMainTaskById(m.id)); // 削除処理を呼ぶ
    row.appendChild(editBtn); row.appendChild(delBtn); // ボタンを行に追加する
    els.mainTaskListContainer.appendChild(row); // 一覧に追加する
  });
}
function openMainTaskItemModal(mainTask, returnToList){ // メインタスク追加・編集モーダルを開く（mainTask省略時は新規追加、returnToListは閉じた後に一覧へ戻るかどうか）
  mainTaskItemModalReturnTo = !!returnToList; // 戻り先情報を保存する（true以外はすべて戻らない扱いにする）
  closeAllModals(); // 他のモーダルを閉じる
  els.mainTaskItemFormError.hidden = true; // エラー表示を隠す
  populateFolderSelect(els.mainTaskFolderSelect, null); // 所属フォルダー候補を構築する
  if(mainTask){ // 編集モードの場合
    els.mainTaskItemModalTitle.textContent = 'メインタスクを編集'; // タイトルを変更する
    els.mainTaskId.value = mainTask.id; // IDをセットする
    els.mainTaskTitle.value = mainTask.title; // タイトルをセットする
    els.mainTaskFolderSelect.value = mainTask.folderId || ''; // 所属フォルダーをセットする
    els.mainTaskDescription.value = mainTask.description || ''; // 備考をセットする
    els.mainTaskStatus.value = mainTask.status; // ステータスをセットする
  } else { // 新規追加モードの場合
    els.mainTaskItemModalTitle.textContent = 'メインタスクを追加'; // タイトルを変更する
    els.mainTaskId.value = ''; // IDを空にする
    els.mainTaskTitle.value = ''; // タイトルを空にする
    els.mainTaskFolderSelect.value = ''; // 所属フォルダー未選択にする
    els.mainTaskDescription.value = ''; // 備考を空にする
    els.mainTaskStatus.value = '未着手'; // ステータスを初期値にする
  }
  els.mainTaskItemModalOverlay.hidden = false; // モーダルを表示する
}
function closeMainTaskItemModal(){ // メインタスク追加・編集モーダルを閉じる（戻り先情報がある場合のみメインタスク管理モーダルへ戻る）
  if(els.mainTaskItemModalOverlay.hidden) return; // 既に閉じている場合は何もしない
  els.mainTaskItemModalOverlay.hidden = true; // 追加・編集モーダルを閉じる
  if(mainTaskItemModalReturnTo) openMainTaskModal(); // 一覧経由で開いていた場合のみメインタスク管理モーダル（一覧）を再度開く
  mainTaskItemModalReturnTo = false; // 戻り先情報をリセットする
}
function saveMainTaskItem(){ // メインタスク追加・編集モーダルの保存ボタン押下時の処理
  const title = els.mainTaskTitle.value.trim(); // タイトルを取得する
  if(!title){ els.mainTaskItemFormError.textContent = 'タスク名を入力してください。'; els.mainTaskItemFormError.hidden = false; return; } // 未入力ならエラー表示する
  const folderId = els.mainTaskFolderSelect.value || null; // 所属フォルダーIDを取得する
  const description = els.mainTaskDescription.value.trim(); // 備考を取得する
  const status = els.mainTaskStatus.value; // ステータスを取得する
  const id = els.mainTaskId.value; // 編集対象のIDを取得する
  const existing = id ? mainTasks.find(m => m.id === id) : null; // 編集対象の更新前データを取得する
  const prevStatus = existing ? existing.status : null; // 更新前のステータスを控える
  let savedId = id; // 保存後に確定するメインタスクIDを保持する
  if(id){ const idx = mainTasks.findIndex(m => m.id === id); if(idx >= 0) mainTasks[idx] = normalizeMainTask({ ...mainTasks[idx], title, folderId, description, status }); } // 既存メインタスクを更新する
  else { const created = normalizeMainTask({ title, folderId, description, status }); mainTasks.push(created); savedId = created.id; } // 新規メインタスクを追加する
  if(status === '完了' && prevStatus !== '完了'){ cascadeCompleteMainTask(savedId); } // 未完了→クローズに変わった瞬間だけ配下を連動して完了にする
  scheduleSave(); // 保存する
  closeMainTaskItemModal(); // モーダルを閉じる（戻り先があればメインタスク管理モーダルへ戻る）
  renderAll(); // ガント等を再描画する
}
function deleteMainTaskById(id){ if(!confirm('このメインタスクと配下のサブタスク/ディテールタスク/マイルストーンを削除しますか？')) return; cascadeDeleteMainTask(id); scheduleSave(); renderMainTaskList(); renderAll(); } // メインタスク削除時の処理

// ===== サブタスク管理モーダル（一覧＋絞り込み＋追加導線） =====
function openSubTaskModal(){ // サブタスク管理モーダルを開く
  closeAllModals(); // 他のモーダルを閉じる
  renderSubTaskList(); // 絞り込み条件に従って一覧を再描画する
  els.subTaskModalOverlay.hidden = false; // モーダルを表示する
}
function closeSubTaskModal(){ els.subTaskModalOverlay.hidden = true; } // サブタスク管理モーダルを閉じる
function renderSubTaskList(){ // サブタスク一覧を描画する（絞り込み・検索を適用する）
  els.subTaskListContainer.innerHTML = ''; // 一旦クリアする
  const list = subTasks.filter(s => matchesStatusSearchFilter(s, els.subTaskFilterStatus, els.subTaskSearchBox)); // 絞り込み条件に一致するサブタスクだけを抽出する
  if(list.length === 0){ els.subTaskListContainer.innerHTML = '<p class="empty-message">該当するサブタスクはありません。</p>'; return; } // 該当なしの場合は案内表示する
  list.forEach(s => { // 抽出したサブタスクを1つずつ表示する
    const range = getItemRange(s); // 計画の代表期間を求める
    const ganttOnlyBadge = s.ganttOnly ? '<span class="badge-gantt-only">ガントのみ</span>' : ''; // リストには出ないがガントには表示される項目の印
    const row = document.createElement('div'); row.className = 'milestone-item'; // 1行分の要素を作成する
    row.innerHTML = `<span class="m-label" title="${escapeHtml(s.description || '')}">${escapeHtml(ancestorPathOfSub(s))}${escapeHtml(s.title)}（${range.start} 〜 ${range.end} / ${s.status}）${ganttOnlyBadge}</span>`; // 末尾にganttOnlyBadgeを連結する
    const editBtn = document.createElement('button'); editBtn.className = 'btn btn-small'; editBtn.textContent = '編集'; // 編集ボタンを作成する
    editBtn.addEventListener('click', () => openItemModal(s, 'sub', 'subTaskModalOverlay')); // 編集を開く（保存/キャンセル後はこのモーダルへ戻る）
    const delBtn = document.createElement('button'); delBtn.className = 'btn btn-small btn-danger'; delBtn.textContent = '削除'; // 削除ボタンを作成する
    delBtn.addEventListener('click', () => { deleteItemById(s.id, 'sub'); renderSubTaskList(); }); // 削除後にこの一覧を再描画する
    row.appendChild(editBtn); row.appendChild(delBtn); // ボタンを行に追加する
    els.subTaskListContainer.appendChild(row); // 一覧に追加する
  });
}

// ===== ディテールタスク管理モーダル（一覧＋絞り込み＋追加導線） =====
function openDetailTaskModal(){ // ディテールタスク管理モーダルを開く
  closeAllModals(); // 他のモーダルを閉じる
  renderDetailTaskList(); // 絞り込み条件に従って一覧を再描画する
  els.detailTaskModalOverlay.hidden = false; // モーダルを表示する
}
function closeDetailTaskModal(){ els.detailTaskModalOverlay.hidden = true; } // ディテールタスク管理モーダルを閉じる
function renderDetailTaskList(){ // ディテールタスク一覧を描画する（絞り込み・検索を適用する）
  els.detailTaskListContainer.innerHTML = ''; // 一旦クリアする
  const list = detailTasks.filter(d => matchesStatusSearchFilter(d, els.detailTaskFilterStatus, els.detailTaskSearchBox)); // 絞り込み条件に一致するディテールタスクだけを抽出する
  if(list.length === 0){ els.detailTaskListContainer.innerHTML = '<p class="empty-message">該当するディテールタスクはありません。</p>'; return; } // 該当なしの場合は案内表示する
  list.forEach(d => { // 抽出したディテールタスクを1つずつ表示する
    const range = getItemRange(d); // 計画の代表期間を求める
    const ganttOnlyBadge = d.ganttOnly ? '<span class="badge-gantt-only">ガントのみ</span>' : ''; // リストには出ないがガントには表示される項目の印
    const row = document.createElement('div'); row.className = 'milestone-item'; // 1行分の要素を作成する
    row.innerHTML = `<span class="m-label" title="${escapeHtml(d.description || '')}">${escapeHtml(ancestorPathOfDetail(d))}${escapeHtml(d.title)}（${range.start} 〜 ${range.end} / ${d.status}）${ganttOnlyBadge}</span>`; // 末尾にganttOnlyBadgeを連結する
    const editBtn = document.createElement('button'); editBtn.className = 'btn btn-small'; editBtn.textContent = '編集'; // 編集ボタンを作成する
    editBtn.addEventListener('click', () => openItemModal(d, 'detail', 'detailTaskModalOverlay')); // 編集を開く（保存/キャンセル後はこのモーダルへ戻る）
    const delBtn = document.createElement('button'); delBtn.className = 'btn btn-small btn-danger'; delBtn.textContent = '削除'; // 削除ボタンを作成する
    delBtn.addEventListener('click', () => { deleteItemById(d.id, 'detail'); renderDetailTaskList(); }); // 削除後にこの一覧を再描画する
    row.appendChild(editBtn); row.appendChild(delBtn); // ボタンを行に追加する
    els.detailTaskListContainer.appendChild(row); // 一覧に追加する
  });
}

// ===== サブタスク/ディテールタスク 追加・編集モーダル =====
function refreshItemModalParentOptions(){ // 現在のフォルダー/メインタスク/サブタスク一覧を選択肢へ反映する
  els.itemParentFolderGroup.innerHTML = ''; // フォルダーのoptgroupをクリアする
  folders.forEach(f => { const opt = document.createElement('option'); opt.value = f.id; opt.textContent = folderPath(f.parentFolderId) + f.name; els.itemParentFolderGroup.appendChild(opt); }); // フォルダー選択肢を追加する
  els.itemParentMainGroup.innerHTML = ''; // メインタスクのoptgroupをクリアする
  mainTasks.forEach(m => { const opt = document.createElement('option'); opt.value = m.id; opt.textContent = folderPath(m.folderId) + m.title; els.itemParentMainGroup.appendChild(opt); }); // メインタスク選択肢を追加する
  els.itemParentSubTaskSelect.innerHTML = ''; // 親サブタスク選択肢をクリアする
  subTasks.forEach(s => { const opt = document.createElement('option'); opt.value = s.id; opt.textContent = ancestorPathOfSub(s) + s.title; els.itemParentSubTaskSelect.appendChild(opt); }); // サブタスク選択肢を追加する
}
function syncItemKindUI(){ // 種別ラジオの選択に応じて表示欄を切り替える
  const isDetail = els.itemKindDetail.checked; // ディテールタスクが選ばれているか
  els.itemParentSubGroup.hidden = isDetail; // サブタスク用の親選択欄の表示切替
  els.itemParentDetailGroup.hidden = !isDetail; // ディテールタスク用の親選択欄の表示切替
}
function openItemModal(item, kind, returnTo){ // item省略時は新規追加。kindは'sub'または'detail'。returnToは閉じた後に再度開く管理モーダルのid（省略可）
  itemModalReturnTo = returnTo || null; // 戻り先の管理モーダルidを保存する（無ければnull）
  closeAllModals(); // 他のモーダルを閉じる
  refreshItemModalParentOptions(); // 親選択肢を最新化する
  els.itemFormError.hidden = true; // エラー表示を隠す
  const isEdit = !!item; // 編集モードかどうか
  els.itemKindSub.disabled = isEdit; els.itemKindDetail.disabled = isEdit; // 編集時は種別変更不可にする（UI自体は常時非表示）
  if(isEdit){ // 編集モードの場合
    els.itemModalTitle.textContent = 'タスクを編集'; // タイトルを変更する
    els.itemId.value = item.id; // IDをセットする
    els.itemTitle.value = item.title; // タイトルをセットする
    els.itemDescription.value = item.description; // 備考をセットする
    els.itemPriority.value = item.priority; // 優先度をセットする
    els.itemStatus.value = item.status; // ステータスをセットする
    els.itemGanttOnly.checked = !!item.ganttOnly; // 既存のガントのみ表示フラグを復元する
    els.itemExcludeFromWorkload.checked = !!item.excludeFromWorkload; // 既存の業務余力計算除外フラグを復元する
    els.itemEffort.value = (typeof item.effort === 'number' && item.effort > 0) ? item.effort : ''; // 既存の手入力工数を復元する（未入力ならプレースホルダー表示のまま空にする）
    els.periodsContainer.innerHTML = ''; // 計画期間入力欄をクリアする
    item.periods.forEach(p => addPeriodRow(p.start, p.end, p.startTime, p.endTime)); // 既存の計画期間を復元する
    els.actualPeriodsContainer.innerHTML = ''; // 実績期間入力欄をクリアする
    item.actualPeriods.forEach(p => addActualPeriodRow(p.start, p.end, p.startTime, p.endTime)); // 既存の実績期間を復元する（無ければ空のまま＝未実施）
    els.btnDeleteItemInModal.hidden = false; // 削除ボタンを表示する
    els.btnDuplicateItemInModal.hidden = false; // 複製ボタンを表示する（既存タスクの編集時のみ複製できるようにする）
    if(kind === 'sub'){ els.itemKindSub.checked = true; els.itemParentSelect.value = item.mainTaskId || item.folderId || ''; } // サブタスクの親を復元する
    else { els.itemKindDetail.checked = true; els.itemParentSubTaskSelect.value = item.subTaskId || ''; } // ディテールタスクの親を復元する
  } else { // 新規追加モードの場合
    els.itemModalTitle.textContent = 'タスクを追加'; // タイトルを変更する
    els.itemId.value = ''; // IDを空にする
    els.itemTitle.value = ''; // タイトルを空にする
    els.itemDescription.value = ''; // 備考を空にする
    els.itemPriority.value = '中'; // 優先度を初期値にする
    els.itemStatus.value = '未着手'; // ステータスを初期値にする
    els.itemGanttOnly.checked = false; // 新規作成時はガントのみ表示フラグを既定でオフにする
    els.itemExcludeFromWorkload.checked = false; // 新規作成時は業務余力計算除外フラグを既定でオフにする
    els.itemEffort.value = ''; // 新規作成時は工数を未入力にする（自動計算に任せる）
    els.periodsContainer.innerHTML = ''; // 計画期間入力欄をクリアする
    addPeriodRow(todayStr(), todayStr()); // 今日1日分の計画期間行を追加する
    els.actualPeriodsContainer.innerHTML = ''; // 実績期間入力欄を空の状態にする（新規作成時は未実施として扱う）
    els.btnDeleteItemInModal.hidden = true; // 削除ボタンを隠す
    els.btnDuplicateItemInModal.hidden = true; // 複製ボタンを隠す（新規作成中は複製元が存在しないため）
    if(kind === 'detail'){ els.itemKindDetail.checked = true; } else { els.itemKindSub.checked = true; } // 呼び出し元で指定されたkindに応じて種別を確定する
    els.itemParentSelect.value = ''; // 親未選択（ルート）にする
  }
  syncItemKindUI(); // 表示欄を種別に合わせて切り替える
  els.itemModalOverlay.dataset.kind = kind; // 現在編集中の種別をDOMに保持する
  els.itemModalOverlay.hidden = false; // モーダルを表示する
}
function closeItemModal(){ // モーダルを閉じる
  els.itemModalOverlay.hidden = true; // 追加・編集モーダルを閉じる
  if(itemModalReturnTo){ // 管理モーダル経由で開いていた場合はそちらへ戻る
    const target = itemModalReturnTo; // 戻り先を確定する
    itemModalReturnTo = null; // 戻り先情報をリセットする
    if(target === 'subTaskModalOverlay') openSubTaskModal(); // サブタスク管理モーダルへ戻る
    else if(target === 'detailTaskModalOverlay') openDetailTaskModal(); // ディテールタスク管理モーダルへ戻る
  }
}

function createPeriodRow(container, start, end, startTime, endTime, enforceMinimum){ // 期間入力欄を1組作成してcontainerに追加する共通処理（enforceMinimumがtrueなら最終1件の削除を禁止する）
  const row = document.createElement('div'); row.className = 'period-row'; // 行のコンテナを作成する
  const s = start || todayStr(); const e = end || s; // 開始日/終了日の初期値
  const isSingleDay = s === e; const timeChecked = !!(isSingleDay && startTime && endTime); // 単日判定と時間指定の有効状態
  row.innerHTML = `
    <div class="period-row-dates">
      <span class="period-row-index"></span>
      <input type="date" class="period-start" value="${s}"><span>〜</span><input type="date" class="period-end" value="${e}">
      <button type="button" class="btn btn-small btn-remove-period">削除</button>
    </div>
    <div class="period-row-time ${isSingleDay ? '' : 'is-disabled'}">
      <label class="period-time-toggle"><input type="checkbox" class="period-time-check" ${timeChecked ? 'checked' : ''} ${isSingleDay ? '' : 'disabled'}>時間を指定</label>
      <input type="time" class="period-start-time" value="${startTime || '09:00'}" ${timeChecked ? '' : 'disabled'}><span>〜</span><input type="time" class="period-end-time" value="${endTime || '18:00'}" ${timeChecked ? '' : 'disabled'}>
    </div>`; // 日付欄・時間指定欄に加え、番号バッジ表示用の空span要素をまとめて生成する
  const startInput = row.querySelector('.period-start'); const endInput = row.querySelector('.period-end'); // 日付入力欄の参照
  const timeRow = row.querySelector('.period-row-time'); const timeCheck = row.querySelector('.period-time-check'); // 時間指定欄の参照
  const startTimeInput = row.querySelector('.period-start-time'); const endTimeInput = row.querySelector('.period-end-time'); // 時刻入力欄の参照
  function syncTimeAvailability(){ // 日付の状態に応じて時間指定欄の有効/無効を切り替える
    const same = startInput.value === endInput.value; // 単日かどうかを判定する
    timeRow.classList.toggle('is-disabled', !same); timeCheck.disabled = !same; // 複数日なら時間指定を無効化する
    if(!same){ timeCheck.checked = false; } // 複数日になったらチェックを外す
    const useTime = same && timeCheck.checked; // 実際に時刻入力を使うかどうか
    startTimeInput.disabled = !useTime; endTimeInput.disabled = !useTime; // 有効/無効を反映する
  }
  startInput.addEventListener('change', syncTimeAvailability); endInput.addEventListener('change', syncTimeAvailability); timeCheck.addEventListener('change', syncTimeAvailability); // 変更時に再判定する
  row.querySelector('.btn-remove-period').addEventListener('click', () => { // 削除ボタン押下時の処理
    if(!enforceMinimum || container.children.length > 1){ row.remove(); renumberPeriodRows(container); } // enforceMinimumがtrueの時だけ最終1件の削除を禁止し、削除後は残った行の番号バッジを振り直す
    else { alert('期間は最低1件必要です。'); } // 最終1件は削除できない旨を通知する
  });
  container.appendChild(row); // 指定されたコンテナに追加する
  renumberPeriodRows(container); // 追加直後に全行の番号バッジを振り直す（末尾に追加された今回の行にも正しい番号が付く）
}

// ここを追加：コンテナ内の期間行を上から順に走査し、「ID:1」「ID:2」…の番号バッジを振り直す共通処理（行の追加・削除のたびに呼び出す）
function renumberPeriodRows(container){ // 番号バッジを再計算する共通処理
  [...container.querySelectorAll('.period-row')].forEach((row, i) => { // コンテナ内のすべての期間行を上から順に処理する
    const badge = row.querySelector('.period-row-index'); // その行の番号バッジ要素を取得する
    if(badge) badge.textContent = `ID:${i + 1}`; // 1始まりの番号を表示する
  });
}
function addPeriodRow(start, end, startTime, endTime){ createPeriodRow(els.periodsContainer, start, end, startTime, endTime, true); } // 計画期間欄への行追加（最低1件を維持する）
function addActualPeriodRow(start, end, startTime, endTime){ createPeriodRow(els.actualPeriodsContainer, start, end, startTime, endTime, false); } // 実績期間欄への行追加（0件まで削除可能にし、未記入=未実施を表現できるようにする）
function collectPeriodsFromContainer(container){ // 指定コンテナ内のすべての期間行を配列として取り出す共通処理
  return [...container.querySelectorAll('.period-row')].map(r => { // 各期間行を1つずつ変換する
    const start = r.querySelector('.period-start').value; const end = r.querySelector('.period-end').value; // 日付を取得する
    const timeChecked = r.querySelector('.period-time-check').checked; // 時間指定の有効状態を取得する
    const startTime = (timeChecked && start === end) ? r.querySelector('.period-start-time').value : ''; // 単日かつ有効時のみ時刻を採用する
    const endTime = (timeChecked && start === end) ? r.querySelector('.period-end-time').value : ''; // 同上
    return { start, end, startTime, endTime }; // 期間オブジェクトを返す
  });
}
function collectPeriodsFromForm(){ return collectPeriodsFromContainer(els.periodsContainer); } // 計画期間欄から取得する
function collectActualPeriodsFromForm(){ return collectPeriodsFromContainer(els.actualPeriodsContainer); } // 実績期間欄から取得する
function saveItemFromForm(){ // 保存ボタン押下時の処理
  const title = els.itemTitle.value.trim(); // タイトルを取得する
  if(!title){ els.itemFormError.textContent = 'タスク名を入力してください。'; els.itemFormError.hidden = false; return; } // 未入力ならエラー表示
  const periods = collectPeriodsFromForm(); // 計画期間配列を取得する
  for(const p of periods){ // 各計画期間を検証する
    if(!p.start || !p.end){ els.itemFormError.textContent = 'すべての計画期間に開始日と終了日を入力してください。'; els.itemFormError.hidden = false; return; } // 未入力チェック
    if(p.start > p.end){ els.itemFormError.textContent = '計画の開始日は終了日より前にしてください。'; els.itemFormError.hidden = false; return; } // 前後関係チェック
    if(p.startTime && p.endTime && p.startTime >= p.endTime){ els.itemFormError.textContent = '計画の時間指定は開始時刻が終了時刻より前になるようにしてください。'; els.itemFormError.hidden = false; return; } // 時刻の前後関係チェック
  }
  const actualPeriodsInput = collectActualPeriodsFromForm(); // 実績期間配列を取得する（空でもよい）
  for(const p of actualPeriodsInput){ // 入力された実績期間についても計画期間と同様の整合性チェックを行う
    if(!p.start || !p.end){ els.itemFormError.textContent = 'すべての実績期間に開始日と終了日を入力してください。'; els.itemFormError.hidden = false; return; } // 未入力チェック
    if(p.start > p.end){ els.itemFormError.textContent = '実績の開始日は終了日より前にしてください。'; els.itemFormError.hidden = false; return; } // 前後関係チェック
    if(p.startTime && p.endTime && p.startTime >= p.endTime){ els.itemFormError.textContent = '実績の時間指定は開始時刻が終了時刻より前になるようにしてください。'; els.itemFormError.hidden = false; return; } // 時刻の前後関係チェック
  }
  const effortInput = els.itemEffort.value.trim(); // 工数入力欄の値を取得する
  if(effortInput !== '' && (isNaN(parseFloat(effortInput)) || parseFloat(effortInput) <= 0)){ els.itemFormError.textContent = '工数は0より大きい数値を入力してください（未入力なら自動計算されます）。'; els.itemFormError.hidden = false; return; } // 不正な工数値のチェック
  const isDetail = els.itemKindDetail.checked; // ディテールタスクかどうか
  const id = els.itemId.value; const now = new Date().toISOString(); // 編集対象IDと現在時刻
  const desc = els.itemDescription.value.trim(); const priority = els.itemPriority.value; const status = els.itemStatus.value; // その他の入力値
  const ganttOnly = els.itemGanttOnly.checked; // ガントチャートのみに表示するフラグを取得する
  const excludeFromWorkload = els.itemExcludeFromWorkload.checked; // 業務余力計算の集計対象から除外するフラグを取得する
  const effort = effortInput === '' ? null : parseFloat(effortInput); // 未入力ならnull（自動計算に任せる）、入力済みなら数値化する
  let actualPeriods = actualPeriodsInput; // 実績期間の確定値（後段で未記入かつ完了時のみ補完する）
  if(status === '完了' && actualPeriods.length === 0){ actualPeriods = clonePeriodsArray(periods); } // 実績が未記入のまま完了で保存した場合は計画期間をそのまま複製する
  if(isDetail){ // ディテールタスクの保存処理
    const subTaskId = els.itemParentSubTaskSelect.value; // 親サブタスクIDを取得する
    if(!subTaskId){ els.itemFormError.textContent = '親サブタスクを選択してください。'; els.itemFormError.hidden = false; return; } // 未選択ならエラー
    if(id){ const idx = detailTasks.findIndex(d => d.id === id); if(idx >= 0) detailTasks[idx] = normalizeDetailTask({ ...detailTasks[idx], title, description: desc, periods, actualPeriods, priority, status, subTaskId, updatedAt: now, ganttOnly, effort, excludeFromWorkload }); } // 工数・業務余力除外フラグを含めて既存を更新する
    else detailTasks.push(normalizeDetailTask({ title, description: desc, periods, actualPeriods, priority, status, subTaskId, createdAt: now, updatedAt: now, ganttOnly, effort, excludeFromWorkload })); // 工数・業務余力除外フラグを含めて新規追加する
  } else { // サブタスクの保存処理
    const parentVal = els.itemParentSelect.value; // 選択された親の値を取得する
    const { mainTaskId, folderId } = resolveSubTaskParent(parentVal, mainTasks, folders); // 親の種類を判定する
    const existing = id ? subTasks.find(s => s.id === id) : null; // 編集対象の更新前データを取得する
    const prevStatus = existing ? existing.status : null; // 更新前のステータスを控える
    let savedId = id; // 保存後に確定するサブタスクIDを保持する
    if(id){ const idx = subTasks.findIndex(s => s.id === id); if(idx >= 0) subTasks[idx] = normalizeSubTask({ ...subTasks[idx], title, description: desc, periods, actualPeriods, priority, status, mainTaskId, folderId, updatedAt: now, ganttOnly, effort, excludeFromWorkload }); } // 工数・業務余力除外フラグを含めて既存を更新する
    else { const created = normalizeSubTask({ title, description: desc, periods, actualPeriods, priority, status, mainTaskId, folderId, createdAt: now, updatedAt: now, ganttOnly, effort, excludeFromWorkload }); subTasks.push(created); savedId = created.id; } // 工数・業務余力除外フラグを含めて新規追加する
    if(status === '完了' && prevStatus !== '完了'){ cascadeCompleteSubTask(savedId); } // 未完了→完了に変わった瞬間だけ配下のディテールタスクを連動して完了にする
  }
  scheduleSave(); closeItemModal(); renderAll(); // 保存・モーダルを閉じる・再描画する
}
function deleteItemById(id, kind){ // タスク削除時の処理
  if(!confirm('このタスクを削除しますか？')) return; // 確認を取る
  if(kind === 'sub') cascadeDeleteSubTask(id); else detailTasks = detailTasks.filter(d => d.id !== id); // 種別に応じて削除する
  scheduleSave(); renderAll(); // 保存・再描画する
}
function duplicateCurrentItem(){ // 編集中のサブタスク/ディテールタスクを複製し、新しいタスクとして追加する（複製元のデータはそのまま変更しない）
  const kind = els.itemModalOverlay.dataset.kind; // 現在編集中の種別（'sub'または'detail'）を取得する
  const id = els.itemId.value; // 複製元のIDを取得する
  if(!id) return; // 新規作成中（未保存）は複製元が無いため何もしない
  const now = new Date().toISOString(); // 複製後の作成日時・更新日時に使う現在時刻
  if(kind === 'sub'){ // サブタスクを複製する場合
    const original = subTasks.find(s => s.id === id); // 複製元のサブタスクを取得する
    if(!original) return; // 見つからなければ何もしない
    const copy = normalizeSubTask({ ...original, id: undefined, title: original.title + '（コピー）', createdAt: now, updatedAt: now, order: undefined }); // ID・作成日時・更新日時・表示順を新規のものにし、タイトルにコピーである旨を付記する
    subTasks.push(copy); // 複製したサブタスクを配列に追加する
  } else { // ディテールタスクを複製する場合
    const original = detailTasks.find(d => d.id === id); // 複製元のディテールタスクを取得する
    if(!original) return; // 見つからなければ何もしない
    const copy = normalizeDetailTask({ ...original, id: undefined, title: original.title + '（コピー）', createdAt: now, updatedAt: now, order: undefined }); // ID・作成日時・更新日時・表示順を新規のものにし、タイトルにコピーである旨を付記する
    detailTasks.push(copy); // 複製したディテールタスクを配列に追加する
  }
  scheduleSave(); // 複製結果を保存する
  closeItemModal(); // モーダルを閉じる（管理モーダル経由で開いていた場合はそちらへ戻る）
  renderAll(); // リスト・ガント・業務余力の表示を再描画する
}

// ===== マイルストーン管理モーダル（一覧＋絞り込み＋追加導線） =====
function matchesMilestoneFilter(m){ // マイルストーン一覧の絞り込み判定（メインタスク＋ステータス＋ラベル検索）
  const mainFilter = els.milestoneFilterMainTask.value; // 選択されたメインタスク絞り込み条件を取得する
  const statusFilter = els.milestoneFilterStatus.value; // 選択されたステータス絞り込み条件（すべて/完了以外）を取得する
  const search = els.milestoneSearchBox.value.trim().toLowerCase(); // 検索文字列を取得する
  if(mainFilter && m.mainTaskId !== mainFilter) return false; // メインタスクが不一致なら除外する
  if(statusFilter === 'notDone'){ // 「完了以外」が選択されている場合のみ判定する
    const mt = mainTasks.find(x => x.id === m.mainTaskId); // 紐づく親のメインタスクを探す
    if(mt && mt.status === '完了') return false; // 親メインタスクがクローズ（完了）済みなら除外する
  }
  if(search && !m.label.toLowerCase().includes(search)) return false; // ラベルが不一致なら除外する
  return true; // それ以外は一致とみなす
}
function refreshMilestoneFilterMainTaskOptions(){ // マイルストーン一覧の絞り込み用セレクトを最新化する
  const current = els.milestoneFilterMainTask.value; // 現在選択中の値を保持する
  els.milestoneFilterMainTask.innerHTML = '<option value="">すべてのメインタスク</option>'; // 「すべて」を先頭に追加する
  mainTasks.forEach(m => { const opt = document.createElement('option'); opt.value = m.id; opt.textContent = folderPath(m.folderId) + m.title; els.milestoneFilterMainTask.appendChild(opt); }); // メインタスク選択肢を追加する
  if([...els.milestoneFilterMainTask.options].some(o => o.value === current)) els.milestoneFilterMainTask.value = current; // 選択中の値がまだ存在するなら復元する
}
function refreshMilestoneMainTaskOptions(){ els.milestoneMainTaskSelect.innerHTML = ''; mainTasks.forEach(m => { const opt = document.createElement('option'); opt.value = m.id; opt.textContent = folderPath(m.folderId) + m.title; els.milestoneMainTaskSelect.appendChild(opt); }); } // 追加・編集モーダル側の必須セレクトを最新化する
function openMilestoneModal(){ // マイルストーン管理モーダル（一覧＋絞り込み＋追加ボタン）を開く
  closeAllModals(); // 他のモーダルを閉じる
  refreshMilestoneFilterMainTaskOptions(); // 絞り込み用のメインタスク選択肢を最新化する
  renderMilestoneList(); // 絞り込み条件に従って一覧を再描画する
  els.milestoneModalOverlay.hidden = false; // モーダルを表示する
}
function closeMilestoneModal(){ els.milestoneModalOverlay.hidden = true; } // マイルストーン管理モーダルを閉じる
function renderMilestoneList(){ // マイルストーン一覧を描画する（絞り込み・検索を適用する）
  els.milestoneListContainer.innerHTML = ''; // 一旦クリアする
  const list = milestones.filter(matchesMilestoneFilter).sort((a, b) => a.date.localeCompare(b.date)); // 絞り込み後に日付順で整列する
  if(list.length === 0){ els.milestoneListContainer.innerHTML = '<p class="empty-message">該当するマイルストーンはありません。</p>'; return; } // 該当なしの場合は案内表示する
  const shapeChar = { diamond: '◆', star: '★', circle: '●' }; // 形状文字マップ
  list.forEach(m => { // 抽出したマイルストーンを1つずつ表示する
    const mt = mainTasks.find(x => x.id === m.mainTaskId); // 紐づくメインタスクを探す
    const row = document.createElement('div'); row.className = 'milestone-item'; // 1行分の要素を作成する
    row.innerHTML = `<span class="m-shape">${shapeChar[m.shape]}</span><span class="m-label">${escapeHtml(m.label)}（${m.date} / ${mt ? escapeHtml(mt.title) : '未割当'}）</span>`; // 形状・ラベル・日付・紐づき先を表示する
    const editBtn = document.createElement('button'); editBtn.className = 'btn btn-small'; editBtn.textContent = '編集'; // 編集ボタンを作成する
    editBtn.addEventListener('click', () => openMilestoneItemModal(m)); // 専用の追加・編集モーダルを開く
    const delBtn = document.createElement('button'); delBtn.className = 'btn btn-small btn-danger'; delBtn.textContent = '削除'; // 削除ボタンを作成する
    delBtn.addEventListener('click', () => { if(confirm('このマイルストーンを削除しますか？')){ milestones = milestones.filter(x => x.id !== m.id); scheduleSave(); renderMilestoneList(); renderAll(); } }); // 削除処理
    row.appendChild(editBtn); row.appendChild(delBtn); // ボタンを行に追加する
    els.milestoneListContainer.appendChild(row); // 一覧に追加する
  });
}
function openMilestoneItemModal(milestone){ // マイルストーン追加・編集モーダルを開く（milestone省略時は新規追加）
  closeAllModals(); // 他のモーダルを閉じる
  refreshMilestoneMainTaskOptions(); // 対象メインタスクの選択肢を最新化する
  if(milestone){ // 編集モードの場合
    els.milestoneItemModalTitle.textContent = 'マイルストーンを編集'; // タイトルを変更する
    els.milestoneId.value = milestone.id; // IDをセットする
    els.milestoneLabel.value = milestone.label; // ラベルをセットする
    els.milestoneDate.value = milestone.date; // 日付をセットする
    els.milestoneShape.value = milestone.shape; // 形状をセットする
    if(milestone.mainTaskId) els.milestoneMainTaskSelect.value = milestone.mainTaskId; // 対象メインタスクをセットする
  } else { // 新規追加モードの場合
    els.milestoneItemModalTitle.textContent = 'マイルストーンを追加'; // タイトルを変更する
    els.milestoneId.value = ''; // IDを空にする
    els.milestoneLabel.value = ''; // ラベルを空にする
    els.milestoneDate.value = todayStr(); // 日付を今日にする
    els.milestoneShape.value = 'diamond'; // 形状を初期値にする
    if(els.milestoneMainTaskSelect.options.length) els.milestoneMainTaskSelect.selectedIndex = 0; // 対象メインタスクの先頭を初期選択にする
  }
  els.milestoneItemModalOverlay.hidden = false; // モーダルを表示する
}
function closeMilestoneItemModal(){ // マイルストーン追加・編集モーダルを閉じてマイルストーン管理モーダルへ戻る
  if(els.milestoneItemModalOverlay.hidden) return; // 既に閉じている場合は何もしない
  els.milestoneItemModalOverlay.hidden = true; // 追加・編集モーダルを閉じる
  openMilestoneModal(); // マイルストーン管理モーダル（一覧）を再度開く
}
function saveMilestoneItem(){ // マイルストーン追加・編集モーダルの保存ボタン押下時の処理
  const label = els.milestoneLabel.value.trim(); const date = els.milestoneDate.value; const mainTaskId = els.milestoneMainTaskSelect.value; // 入力値を取得する
  if(!label || !date){ alert('ラベルと日付を入力してください。'); return; } // 未入力チェック
  if(!mainTaskId){ alert('メインタスクを選択してください（先に「メインタスク管理」からメインタスクを作成してください）。'); return; } // 未選択チェック
  const shape = els.milestoneShape.value; const id = els.milestoneId.value; // その他の値を取得する
  if(id){ const idx = milestones.findIndex(m => m.id === id); if(idx >= 0) milestones[idx] = normalizeMilestone({ id, mainTaskId, label, date, shape }); } // 既存を更新する
  else milestones.push(normalizeMilestone({ mainTaskId, label, date, shape })); // 新規追加する
  scheduleSave(); // 保存する
  closeMilestoneItemModal(); // モーダルを閉じてマイルストーン管理モーダルへ戻る
  renderAll(); // 再描画する
}
//----------------------------------------------------------------------------------------------------------------------------------------------------
//モーダル管理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//リスト表示処理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
function getSortedSubTasks(){ return subTasks.filter(matchesFilter).sort(compareItems); } // リスト表示用：絞り込み＋「並び替え」ドロップダウンの基準でソートする
function getSortedDetailTasks(){ return detailTasks.filter(matchesFilter).sort(compareItems); } // リスト表示用：同上

// ===== リスト表示描画 =====
function renderList(){ // リストビューを描画する
  const combined = [...getSortedSubTasks().filter(s => !s.ganttOnly).map(s => ({ item: s, kind: 'sub' })), ...getSortedDetailTasks().filter(d => !d.ganttOnly).map(d => ({ item: d, kind: 'detail' }))]; // ganttOnlyフラグが立っている項目はリストから除外する
  combined.sort((a,b) => compareItems(a.item, b.item)); // 統合後に再度並び替える
  els.taskListBody.innerHTML = ''; // 一旦クリアする
  els.emptyMessage.hidden = combined.length > 0; // 空の場合のみ案内文を表示する
  for(const { item, kind } of combined){ // 1件ずつ行を作る
    const range = getItemRange(item); // 計画の代表期間を求める
    const planText = item.periods.length > 1 ? `${formatRangeShort(range.start, range.end)}（${item.periods.length}件）` : formatRangeShort(range.start, range.end); // 計画期間を短縮フォーマットで表示する文字列
    const actualRange = getItemActualRange(item); // 実績の代表期間を求める（未記入ならnull）
    const actualText = actualRange ? (item.actualPeriods.length > 1 ? `${formatRangeShort(actualRange.start, actualRange.end)}（${item.actualPeriods.length}件）` : formatRangeShort(actualRange.start, actualRange.end)) : '－'; // 実績が無ければ「－」を表示する
    const rawPath = kind === 'detail' ? ancestorPathOfDetail(item) : ancestorPathOfSub(item); // 所属パス（末尾に" > "が残った状態）を求める
    const path = trimTrailingArrow(rawPath); // 表示用に末尾の" > "を取り除く
    const kindLabel = kind === 'detail' ? 'ディテールタスク' : 'サブタスク'; // 種別ラベル
    const nameCellHtml = `<div class="row-title">${escapeHtml(item.title)}</div><div class="row-kind-badge">${kindLabel}</div>${path ? `<div class="row-path">${escapeHtml(path)}</div>` : ''}`; // タスク名・種別ラベル・所属パスの3段を組み立てる
    const tr = document.createElement('tr'); // 行要素を作成する
    tr.innerHTML = `<td>${nameCellHtml}</td><td class="col-period">${planText}</td><td class="col-period">${actualText}</td><td>${item.priority}</td><td>${item.status}</td><td></td>`; // 計画期間・実績期間を別列として埋める
    const editBtn = document.createElement('button'); editBtn.className = 'btn btn-small'; editBtn.textContent = '編集'; editBtn.addEventListener('click', () => openItemModal(item, kind)); // 編集ボタン
    const delBtn = document.createElement('button'); delBtn.className = 'btn btn-small btn-danger'; delBtn.textContent = '削除'; delBtn.addEventListener('click', () => deleteItemById(item.id, kind)); // 削除ボタン
    tr.lastElementChild.appendChild(editBtn); tr.lastElementChild.appendChild(delBtn); // 操作列にボタンを追加する
    els.taskListBody.appendChild(tr); // テーブルに行を追加する
  }
}
//----------------------------------------------------------------------------------------------------------------------------------------------------
//リスト表示処理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//ガントチャート処理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== 折りたたみ制御 =====
function toggleCollapse(kind, id){ // フォルダー/メインタスク/サブタスクの折りたたみを個別に切り替える
  if(kind === 'folder'){ const f = folders.find(x => x.id === id); if(f) f.collapsed = !f.collapsed; } // フォルダーの折りたたみを切り替える
  else if(kind === 'main'){ const m = mainTasks.find(x => x.id === id); if(m) m.collapsed = !m.collapsed; } // メインタスクの折りたたみを切り替える
  else if(kind === 'sub'){ const s = subTasks.find(x => x.id === id); if(s) s.collapsed = !s.collapsed; } // サブタスクの折りたたみを切り替える
  scheduleSave(); renderGanttSection(); // 保存してガントを再描画する
}
function toggleCollapseAll(collapse){ // すべての折りたたみ状態を一括で切り替える
  folders.forEach(f => f.collapsed = collapse); mainTasks.forEach(m => m.collapsed = collapse); subTasks.forEach(s => s.collapsed = collapse); // すべての階層に同じ状態を適用する
  scheduleSave(); renderGanttSection(); // 保存してガントを再描画する
}

// ===== ガントチャート専用の絞り込み済みタスク取得（手動並び順(order)を使う） =====
function getGanttSubTasks(){ return subTasks.filter(matchesFilter).sort((a, b) => a.order - b.order); } // ガント表示用：絞り込みは適用するが、並び順はドラッグで決めた手動順(order)を使う
function getGanttDetailTasks(){ return detailTasks.filter(matchesFilter).sort((a, b) => a.order - b.order); } // ガント表示用：同上

// ===== ガントチャート：表示行リストの再帰構築 =====
function buildVisibleRows(){ // フォルダー階層とメイン/サブ/ディテール階層を統合した表示順の行リストを作る
  const rows = []; // 結果を格納する配列
  const sortedMains = mainTasks; // メインタスクは常に全件表示する（表示順はorderで整列する）
  const sortedSubs = getGanttSubTasks(); // ガント専用の手動順(order)で整列済みのサブタスクを使う
  const sortedDetails = getGanttDetailTasks(); // ガント専用の手動順(order)で整列済みのディテールタスクを使う
  function walkSubDetails(s, depth){ sortedDetails.filter(d => d.subTaskId === s.id).forEach(d => rows.push({ kind: 'detail', node: d, depth })); } // サブタスク配下のディテールタスクを追加する
  function walkMainSubs(m, depth){ sortedSubs.filter(s => s.mainTaskId === m.id).forEach(s => { rows.push({ kind: 'sub', node: s, depth }); if(!s.collapsed) walkSubDetails(s, depth + 1); }); } // メインタスク配下のサブタスクを追加する
  function walkFolder(parentFolderId, depth){ // フォルダー配下を再帰的にたどる
    const childFolders = folders.filter(f => f.parentFolderId === parentFolderId).sort((a, b) => a.order - b.order); // 子フォルダーを手動順(order)で取得する
    childFolders.forEach(f => { rows.push({ kind: 'folder', node: f, depth }); if(!f.collapsed) walkFolder(f.id, depth + 1); }); // 子フォルダーを追加する
    const childMains = sortedMains.filter(m => m.folderId === parentFolderId).sort((a, b) => a.order - b.order); // 直下のメインタスクを手動順(order)で取得する
    childMains.forEach(m => { rows.push({ kind: 'main', node: m, depth }); if(!m.collapsed) walkMainSubs(m, depth + 1); }); // 直下のメインタスクを追加する
    sortedSubs.filter(s => !s.mainTaskId && s.folderId === parentFolderId).forEach(s => { rows.push({ kind: 'sub', node: s, depth }); if(!s.collapsed) walkSubDetails(s, depth + 1); }); // 直下の単独サブタスクを追加する
  }
  walkFolder(null, 0); // ルートから開始する
  return rows; // 完成した行リストを返す
}
function renderRowLabel(row){ // 折りたたみアイコン付きの行ラベルDOM要素を生成する（日付/時間ビュー共通）
  const label = document.createElement('div'); label.className = 'gantt-row-label'; // ラベル要素を作成する
  label.style.paddingLeft = (8 + row.depth * 16) + 'px'; // 深さに応じたインデントを付ける
  label.tabIndex = 0; // フォーカス可能にする
  let toggleHtml = ''; // 折りたたみボタンのHTML
  if(row.kind === 'folder') toggleHtml = `<button type="button" class="toggle-icon-btn" data-kind="folder" data-id="${row.node.id}">${row.node.collapsed ? '▶' : '▼'}</button>📁`; // フォルダーの場合のボタン
  else if(row.kind === 'main') toggleHtml = `<button type="button" class="toggle-icon-btn" data-kind="main" data-id="${row.node.id}">${row.node.collapsed ? '▶' : '▼'}</button>`; // メインタスクの場合のボタン
  else if(row.kind === 'sub' && detailTasks.some(d => d.subTaskId === row.node.id)) toggleHtml = `<button type="button" class="toggle-icon-btn" data-kind="sub" data-id="${row.node.id}">${row.node.collapsed ? '▶' : '▼'}</button>`; // 子を持つサブタスクの場合のボタン
  const nameText = row.kind === 'folder' ? row.node.name : row.node.title; // 表示名を取得する
  const isClosedRow = (row.kind === 'folder' || row.kind === 'main') && row.node.status === '完了'; // フォルダー/メインタスクがクローズ済みかどうかを判定する
  if(isClosedRow) label.classList.add('is-closed-row'); // クローズ済みの行に専用クラスを付与する
  const closedTag = isClosedRow ? '<span class="row-closed-tag" title="クローズ済み">🔒</span>' : ''; // クローズ済みであることを示す小さなアイコン
  const ganttOnlyTag = (row.kind === 'sub' || row.kind === 'detail') && row.node.ganttOnly ? '<span class="row-ganttonly-tag" title="リスト表示には出ません（ガントチャートのみ）">G</span>' : ''; // ガントのみ表示フラグが立っている場合の小さな丸バッジ
  label.innerHTML = toggleHtml + `<span class="row-name">${escapeHtml(nameText)}</span>` + ganttOnlyTag + closedTag; // ボタン・名前・バッジ・クローズタグを連結する
  label.title = nameText; // ブラウザ標準のtitle属性には名前のみを表示する
  const btn = label.querySelector('.toggle-icon-btn'); if(btn) btn.addEventListener('click', e => { e.stopPropagation(); toggleCollapse(row.kind, row.node.id); }); // ボタンクリックが親イベントに干渉しないようstopPropagationを付与
  if(row.kind === 'sub' || row.kind === 'detail') label.querySelector('.row-name').addEventListener('dblclick', () => openItemModal(row.node, row.kind)); // 名前部分のダブルクリックで編集を開く
  label.addEventListener('contextmenu', e => { // 行ラベルの右クリックで種別に応じた編集モーダルを開く
    e.preventDefault(); // ブラウザ標準メニューを抑制する
    if(row.kind === 'folder') openFolderModalForEdit(row.node.id); // フォルダーならフォルダー編集を開く
    else if(row.kind === 'main') openMainTaskModalForEdit(row.node.id); // メインタスクならメインタスク編集を開く
    else openItemModal(row.node, row.kind); // サブ/ディテールならタスク編集を開く
  });
  label.draggable = true; // 行ラベル全体をドラッグ可能にする
  label.dataset.rowKind = row.kind; // ドラッグ判定用に自分の種別をDOMへ保持する
  label.dataset.rowId = row.node.id; // ドラッグ判定用に自分のIDをDOMへ保持する
  label.addEventListener('dragstart', e => { // ドラッグ開始時の処理
    if(e.target.closest('.toggle-icon-btn')){ e.preventDefault(); return; } // 折りたたみボタン上からのドラッグ開始は無効化する
    ganttDragSource = { kind: row.kind, id: row.node.id }; // ドラッグ元の行情報をグローバルに保存する
    e.dataTransfer.effectAllowed = 'move'; // 移動操作であることを明示する
    e.dataTransfer.setData('text/plain', row.node.id); // 一部ブラウザで必要なダミーデータを設定する
    requestAnimationFrame(() => label.classList.add('dragging-row')); // 次フレームでドラッグ中の見た目を適用する
  });
  label.addEventListener('dragend', () => { // ドラッグ終了時の後片付け
    label.classList.remove('dragging-row'); // 自分自身のドラッグ中スタイルを解除する
    clearGanttDropIndicators(); // すべての行のドロップ位置表示をリセットする
    ganttDragSource = null; // ドラッグ元情報をクリアする
  });
  label.addEventListener('dragover', e => { // 他の行の上をドラッグで通過している間の処理
    if(!ganttDragSource) return; // ドラッグ中でなければ何もしない
    e.preventDefault(); // ドロップを許可するためデフォルト動作を止める
    const target = { kind: row.kind, id: row.node.id }; // ホバー中の行を対象として組み立てる
    const zone = computeDropZone(e, label, ganttDragSource, target); // 挿入位置(before/after/into)を判定する
    clearGanttDropIndicators(); // 一旦すべての行の表示をリセットする
    if(zone) label.classList.add('drop-' + zone); // 有効な位置であれば対応するクラスを付与する
    e.dataTransfer.dropEffect = zone ? 'move' : 'none'; // 有効/無効に応じてカーソル表示を変える
  });
  label.addEventListener('drop', e => { // ドロップされた時の処理
    e.preventDefault(); // デフォルト動作を止める
    if(!ganttDragSource) return; // ドラッグ中でなければ何もしない
    const target = { kind: row.kind, id: row.node.id }; // ドロップ先の行情報を組み立てる
    const zone = computeDropZone(e, label, ganttDragSource, target); // 挿入位置を判定する
    clearGanttDropIndicators(); // 表示をリセットする
    if(zone) handleGanttRowDrop(ganttDragSource, target, zone); // 有効な位置であれば実際に移動処理を行う
  });
  return label; // 完成したラベル要素を返す
}

// ===== ガントチャート：行ラベルのドラッグ&ドロップ（移動・並び替え）ロジック =====
function getArrayByKind(kind){ if(kind === 'folder') return folders; if(kind === 'main') return mainTasks; if(kind === 'sub') return subTasks; return detailTasks; } // 種別に対応するデータ配列を返す
function findNodeByKindId(kind, id){ return getArrayByKind(kind).find(n => n.id === id); } // 種別とIDから該当ノードを探す
function canNodeBeChildOfKind(draggedKind, containerKind){ // ドラッグ中の種別が、指定コンテナ種別の子になれるかを判定する
  if(draggedKind === 'folder') return containerKind === 'folder' || containerKind === 'root'; // フォルダーはフォルダーかルート直下にのみ置ける
  if(draggedKind === 'main') return containerKind === 'folder' || containerKind === 'root'; // メインタスクはフォルダーかルート直下にのみ置ける
  if(draggedKind === 'sub') return containerKind === 'folder' || containerKind === 'main' || containerKind === 'root'; // サブタスクはフォルダー/メインタスク/ルート直下に置ける
  if(draggedKind === 'detail') return containerKind === 'sub'; // ディテールタスクはサブタスクの中にのみ置ける
  return false; // それ以外の組み合わせは不可
}
function isFolderIntoOwnDescendant(source, containerKind, containerId){ return source.kind === 'folder' && containerKind === 'folder' && collectFolderAndDescendants(source.id).includes(containerId); } // フォルダーを自分自身/子孫フォルダーの中に入れようとしていないかを判定する
function getContainerRefOfRow(kind, id){ // 指定した行が現在所属しているコンテナ（親）を { kind, id } の形で返す
  const node = findNodeByKindId(kind, id); // 対象ノードを取得する
  if(!node) return { kind: 'root', id: null }; // 見つからなければルート扱いにする
  if(kind === 'folder') return node.parentFolderId ? { kind: 'folder', id: node.parentFolderId } : { kind: 'root', id: null }; // フォルダーの所属先
  if(kind === 'main') return node.folderId ? { kind: 'folder', id: node.folderId } : { kind: 'root', id: null }; // メインタスクの所属先
  if(kind === 'sub'){ if(node.mainTaskId) return { kind: 'main', id: node.mainTaskId }; if(node.folderId) return { kind: 'folder', id: node.folderId }; return { kind: 'root', id: null }; } // サブタスクの所属先
  return { kind: 'sub', id: node.subTaskId }; // ディテールタスクの所属先（親サブタスク）
}
function getSiblingsOf(node, kind){ // 指定ノードと同じコンテナに属する、自分以外の兄弟一覧を返す
  const arr = getArrayByKind(kind); // 種別に対応する配列を取得する
  if(kind === 'folder') return arr.filter(n => n.parentFolderId === node.parentFolderId && n.id !== node.id); // 同じ親フォルダーを持つフォルダー
  if(kind === 'main') return arr.filter(n => n.folderId === node.folderId && n.id !== node.id); // 同じ所属フォルダーを持つメインタスク
  if(kind === 'sub') return arr.filter(n => n.mainTaskId === node.mainTaskId && n.folderId === node.folderId && n.id !== node.id); // 同じ所属先を持つサブタスク
  return arr.filter(n => n.subTaskId === node.subTaskId && n.id !== node.id); // 同じ親サブタスクを持つディテールタスク
}
function assignParent(node, kind, containerKind, containerId){ // ノードの所属先(親)を切り替える
  if(kind === 'folder'){ node.parentFolderId = containerKind === 'folder' ? containerId : null; } // フォルダーの親フォルダーを更新する
  else if(kind === 'main'){ node.folderId = containerKind === 'folder' ? containerId : null; } // メインタスクの所属フォルダーを更新する
  else if(kind === 'sub'){ node.mainTaskId = containerKind === 'main' ? containerId : null; node.folderId = containerKind === 'folder' ? containerId : null; } // サブタスクの所属を更新する
  else { node.subTaskId = containerId; } // ディテールタスクの親サブタスクを更新する
}
function moveToEndOfSiblings(node, kind){ // ノードを新しい所属先の末尾に配置する
  const siblings = getSiblingsOf(node, kind); // 新しい所属先の兄弟一覧を取得する
  const maxOrder = siblings.reduce((m, s) => Math.max(m, s.order), -Infinity); // 兄弟の中の最大order値を求める
  node.order = siblings.length > 0 ? maxOrder + 1 : 0; // 末尾に配置されるようorderを設定する
}
function reorderWithinSiblings(node, kind, targetId, dropZone){ // 同じ種別同士の場合に、対象の直前/直後へ正確に挿入する
  const siblings = getSiblingsOf(node, kind).sort((a, b) => a.order - b.order); // 自分以外の兄弟を現在の並び順で取得する
  const targetIndex = siblings.findIndex(s => s.id === targetId); // ドロップ先の位置を探す
  if(targetIndex === -1){ moveToEndOfSiblings(node, kind); return; } // ターゲットが見つからない場合は末尾に配置して終える
  const insertIndex = dropZone === 'after' ? targetIndex + 1 : targetIndex; // 「前」か「後ろ」かに応じて挿入位置を決める
  siblings.splice(insertIndex, 0, node); // 自分をその位置に挿入する
  siblings.forEach((s, i) => { s.order = i; }); // 兄弟全員のorderを0から振り直して確定する
}
function computeDropZone(e, labelEl, source, target){ // マウス位置とルールから、有効なドロップ位置(before/after/into)を判定する
  if(source.kind === target.kind && source.id === target.id) return null; // 自分自身へのドロップは常に無効
  const rect = labelEl.getBoundingClientRect(); // 対象行の画面上の位置とサイズを取得する
  const ratio = (e.clientY - rect.top) / rect.height; // 行内でのマウス縦位置の割合(0〜1)を求める
  const intoAllowed = canNodeBeChildOfKind(source.kind, target.kind) && !isFolderIntoOwnDescendant(source, target.kind, target.id); // 「中に入れる」が可能かどうか
  const containerRef = getContainerRefOfRow(target.kind, target.id); // 「前/後ろに並べる」場合に使う、ターゲットと同じ所属先
  const beforeAfterAllowed = canNodeBeChildOfKind(source.kind, containerRef.kind) && !isFolderIntoOwnDescendant(source, containerRef.kind, containerRef.id); // 「前/後ろに並べる」が可能かどうか
  if(ratio < 0.25) return beforeAfterAllowed ? 'before' : (intoAllowed ? 'into' : null); // 上寄りなら基本「前」に並べる
  if(ratio > 0.75) return beforeAfterAllowed ? 'after' : (intoAllowed ? 'into' : null); // 下寄りなら基本「後ろ」に並べる
  if(intoAllowed) return 'into'; // 中央付近は基本「中に入れる」を優先する
  return beforeAfterAllowed ? (ratio < 0.5 ? 'before' : 'after') : null; // 「中に入れる」が不可なら前後判定にフォールバックする
}
function clearGanttDropIndicators(){ document.querySelectorAll('.gantt-row-label').forEach(el => el.classList.remove('drop-before', 'drop-after', 'drop-into')); } // すべての行のドロップ位置表示をリセットする
function handleGanttRowDrop(source, target, dropZone){ // ドロップ確定時に実際のデータ移動を行う
  const sourceNode = findNodeByKindId(source.kind, source.id); // ドラッグ元のノードを取得する
  if(!sourceNode) return; // 見つからなければ何もしない
  if(dropZone === 'into'){ // 「中に入れる」場合の処理
    assignParent(sourceNode, source.kind, target.kind, target.id); // ターゲット自体を新しい所属先にする
    moveToEndOfSiblings(sourceNode, source.kind); // 新しい所属先の末尾に配置する
  } else { // 「前/後ろに並べる」場合の処理
    const containerRef = getContainerRefOfRow(target.kind, target.id); // ターゲットと同じ所属先を求める
    assignParent(sourceNode, source.kind, containerRef.kind, containerRef.id); // 同じ所属先に変更する
    if(source.kind === target.kind) reorderWithinSiblings(sourceNode, source.kind, target.id, dropZone); // 同じ種別同士なら正確な位置に挿入する
    else moveToEndOfSiblings(sourceNode, source.kind); // 種別が異なる場合は末尾に配置する
  }
  scheduleSave(); // 変更を保存する
  renderAll(); // 画面を再描画する
}

// ===== ガントチャート描画（日付ベースビュー） =====
function buildDateHeaderCells(start, days, colWidth){ // 月ラベル行・日番号ラベル行・曜日ラベル行の3段のセルを、共通グリッド上の正確な行・列番号を指定して生成する
  const monthCells = []; const dayCells = []; const weekdayCells = []; const boundaries = []; let i = 0; // 各配列と現在位置
  while(i < days){ // 日数分繰り返す
    const d = addDays(start, i); const monthKey = `${d.getFullYear()}/${d.getMonth() + 1}`; let span = 0; // 月キーと連続日数
    while(i + span < days){ const dd = addDays(start, i + span); if(`${dd.getFullYear()}/${dd.getMonth() + 1}` !== monthKey) break; span++; } // 同じ月が続く間だけspanを伸ばす
    const mc = document.createElement('div'); mc.className = 'gantt-head-month'; mc.style.gridRow = '1'; mc.style.gridColumn = `${i + 1} / span ${span}`; mc.textContent = `${d.getFullYear()}年${d.getMonth() + 1}月`; // タスク名列がグリッド外へ分離されたため、開始列番号を(i+2)から(i+1)へ変更する
    mc.style.height = `${GANTT_HEAD_ROW1_PX}px`; mc.style.top = '0px'; monthCells.push(mc); i += span; // 高さとstickyのtop位置（1段目=0px）をJS側で明示的に指定し、スクロール追従時の位置ズレを防ぐ
  }
  for(let j = 0; j < days; j++){ // 日番号セル・曜日セルを1つずつ生成する
    const d = addDays(start, j); const next = addDays(start, j + 1); // 対象日と翌日
    const isMonthEnd = d.getMonth() !== next.getMonth(); const isYearEnd = d.getFullYear() !== next.getFullYear(); // 月末/年末判定
    boundaries.push({ isMonthEnd, isYearEnd }); // 境目情報を記録する
    const isWeekend = d.getDay() === 0 || d.getDay() === 6; const isToday = toDateStr(d) === todayStr(); // 土日・今日の判定を先に行い日番号セル/曜日セルの両方で使う
    const dc = document.createElement('div'); dc.className = 'gantt-head-cell'; // 日番号セル要素を作成する
    if(isWeekend) dc.classList.add('weekend'); // 土日を強調する
    if(isToday) dc.classList.add('today-col'); // 今日を強調する
    if(isYearEnd) dc.classList.add('year-end'); else if(isMonthEnd) dc.classList.add('month-end'); // 年の境目を優先して太線を付ける
    dc.style.gridRow = '2'; dc.style.gridColumn = String(j + 1); // タスク名列がグリッド外へ分離されたため、列番号を(j+2)から(j+1)へ変更する
    dc.style.height = `${GANTT_HEAD_ROW2_PX}px`; dc.style.top = `${GANTT_HEAD_ROW1_PX}px`; // 高さと、1段目の高さ分だけ下げたsticky top位置をJS側で明示的に指定する
    dc.textContent = colWidth < 10 ? '' : d.getDate(); dayCells.push(dc); // 幅が狭い場合は日番号を省略する
    const wc = document.createElement('div'); wc.className = 'gantt-head-weekday-cell'; // 日番号の下に表示する曜日セル要素を新設する
    const wd = getWeekdayInfo(d); // 曜日の表示テキストと土日フラグを取得する
    if(isWeekend) wc.classList.add('weekend'); // 曜日セルにも土日の薄紫背景を付ける
    if(wd.isSat) wc.classList.add('sat-text'); // 土曜日だけ文字色を青にする
    if(wd.isSun) wc.classList.add('sun-text'); // 日曜日だけ文字色を赤にする
    if(isToday) wc.classList.add('today-col'); // 今日の曜日セルも強調する
    if(isYearEnd) wc.classList.add('year-end'); else if(isMonthEnd) wc.classList.add('month-end'); // 月末/年末の境目線を曜日セルにも引き継ぐ
    wc.style.gridRow = '3'; wc.style.gridColumn = String(j + 1); // タスク名列がグリッド外へ分離されたため、列番号を(j+2)から(j+1)へ変更する
    wc.style.height = `${GANTT_HEAD_ROW3_PX}px`; wc.style.top = `${GANTT_HEAD_ROW1_PX + GANTT_HEAD_ROW2_PX}px`; // 高さと、1段目+2段目の高さ分だけ下げたsticky top位置をJS側で明示的に指定する
    wc.textContent = colWidth < 10 ? '' : wd.text; weekdayCells.push(wc); // 幅が狭い場合は曜日テキストも省略する
  }
  return { monthCells, dayCells, weekdayCells, boundaries }; // 4種の結果をまとめて返す
}
function renderGanttDateView(){ // 日付ベース（週/月/四半期/年）のガントチャートを描画する
  const preset = ZOOM_PRESETS[ganttZoom]; const days = getGanttDateViewDays(ganttZoom, ganttViewStart), colWidth = preset.colWidth, start = ganttViewStart; // ここを修正：daysは固定値のpreset.daysではなく、対象月の実日数+7バッファで動的に算出したgetGanttDateViewDays()の結果を使う（31日ある月への対応）
  const grid = els.ganttGrid; grid.innerHTML = ''; grid.style.gridTemplateColumns = `repeat(${days}, ${colWidth}px)`; // グリッドは日付列のみで構成する（タスク名列はganttLabelPaneへ分離したため200px分をここから削除した）
  const labelPane = els.ganttLabelPane; labelPane.innerHTML = ''; labelPane.style.width = `${GANTT_LABEL_WIDTH_PX}px`; // ラベルペインをクリアし、幅を定数から設定する（横スクロールの影響を受けない専用ペイン）
  const labelHead = document.createElement('div'); labelHead.className = 'gantt-head-label'; labelHead.style.height = `${GANTT_HEAD_ROW1_PX + GANTT_HEAD_ROW2_PX + GANTT_HEAD_ROW3_PX}px`; labelHead.textContent = 'タスク名'; labelPane.appendChild(labelHead); // 左上見出しをラベルペインの先頭に追加する（月・日・曜日3段分の高さに合わせる）
  const { monthCells, dayCells, weekdayCells, boundaries } = buildDateHeaderCells(start, days, colWidth); // ヘッダーセルを生成する（列番号は関数内で1列目基準に変更済み）
  monthCells.forEach(c => grid.appendChild(c)); dayCells.forEach(c => grid.appendChild(c)); weekdayCells.forEach(c => grid.appendChild(c)); // ヘッダーを日付グリッドに追加する（曜日行も忘れずに追加する）
  const viewEnd = addDays(start, days - 1); // 表示範囲の終端日
  const rows = buildVisibleRows(); // 表示すべき行リストを構築する
  rows.forEach((row, rowIdx) => { // 各行をラベルペイン側・日付グリッド側の両方に、同じ順番・同じ高さで描画する
    const gridRowNum = rowIdx + 4; // ヘッダー3行分(月・日番号・曜日)を避けて行番号を決める（日付グリッド側のみで使用する）
    const isAltRow = rowIdx % 2 === 1; // 1行おきの縞模様にするため、行番号が奇数かどうかを判定する
    const rowHeight = row.kind === 'folder' ? GANTT_ROW_FOLDER_PX : (row.kind === 'main' ? GANTT_ROW_MAIN_PX : GANTT_ROW_TASK_PX); // 行の種類に応じた高さを1箇所で決定し、ラベル側と日付グリッド側の両方に同じ値を反映させる
    const label = renderRowLabel(row); label.style.height = `${rowHeight}px`; label.classList.toggle('gantt-row-alt', isAltRow); labelPane.appendChild(label); // ラベルペインに直接追加する（gridRow/gridColumnの指定は不要になった）
    for(let i = 0; i < days; i++){ // 背景の日セルを日付グリッドの一部として直接配置する
      const d = addDays(start, i); const cell = document.createElement('div'); cell.className = 'gantt-day-cell'; // 日セル要素
      if(d.getDay() === 0 || d.getDay() === 6) cell.classList.add('weekend'); // 土日強調
      if(toDateStr(d) === todayStr()) cell.classList.add('today-col'); // 今日強調
      if(boundaries[i].isYearEnd) cell.classList.add('year-end'); else if(boundaries[i].isMonthEnd) cell.classList.add('month-end'); // 境目線
      cell.classList.toggle('gantt-row-alt', isAltRow); // 日セルにも同じ縞模様クラスを適用する
      cell.style.gridRow = String(gridRowNum); cell.style.gridColumn = String(i + 1); // タスク名列が無くなったため列番号を(i+2)から(i+1)へ変更する
      cell.style.height = `${rowHeight}px`; // ラベル側と行の高さを完全に一致させるため明示的に指定する（グリッドの暗黙サイズに頼らない）
      grid.appendChild(cell); // 日付グリッドに直接追加する
    }
    if(row.kind === 'main'){ // メインタスク行なら全体ラインとマイルストーンを描画する
      const lane = document.createElement('div'); lane.className = 'gantt-overall-row'; lane.style.gridRow = String(gridRowNum); lane.style.gridColumn = `1 / ${1 + days}`; lane.style.position = 'relative'; lane.style.height = `${rowHeight}px`; // 列範囲を(2〜)から(1〜)へ変更し、高さも明示的に指定する
      lane.classList.toggle('gantt-row-alt', isAltRow); // 全体行のレーンにも縞模様クラスを適用する
      lane.addEventListener('contextmenu', e => { e.preventDefault(); openMainTaskModalForEdit(row.node.id); }); // 全体行の右クリックでメインタスク編集を開く
      const line = document.createElement('div'); line.className = 'gantt-overall-line'; lane.appendChild(line); // 矢印ラインを追加する
      milestones.filter(mi => mi.mainTaskId === row.node.id).forEach((mi, idx) => { // このメインタスクに紐づくマイルストーンだけを描画する
        const offset = diffDays(start, parseDateStr(mi.date)); if(offset < 0 || offset >= days) return; // 表示範囲外は無視する
        const marker = document.createElement('div'); marker.className = 'milestone-marker ' + (idx % 2 === 0 ? 'label-top' : 'label-bottom'); marker.style.left = `${offset * colWidth + colWidth / 2}px`; // マーカー位置
        const shapeChar = { diamond: '◆', star: '★', circle: '●' }[mi.shape]; // 形状文字
        marker.innerHTML = `${shapeChar}<span class="m-label-text">${escapeHtml(mi.label)}</span>`; lane.appendChild(marker); // マーカーを追加する
      });
      grid.appendChild(lane); // レーンを日付グリッドに追加する
    } else if(row.kind === 'sub' || row.kind === 'detail'){ // サブタスク／ディテールタスク行なら計画・実績の2段バーを描画する
      const item = row.node, kind = row.kind; let anyVisible = false; // 対象アイテムと表示済みフラグ
      const lane = document.createElement('div'); lane.className = 'gantt-task-lane'; lane.style.gridRow = String(gridRowNum); lane.style.gridColumn = `1 / ${1 + days}`; lane.style.height = `${rowHeight}px`; // 列範囲を(2〜)から(1〜)へ変更し、高さも明示的に指定する
      lane.classList.toggle('gantt-row-alt', isAltRow); // タスクレーンにも縞模様クラスを適用する
      function placeBar(period, periodIndex, trackClass, topPx, periodsField){ // 計画/実績どちらのバーも共通の手順で配置する内部関数
        const pStart = parseDateStr(period.start), pEnd = parseDateStr(period.end); // 期間の開始/終了
        if(pEnd < start || pStart > viewEnd) return; anyVisible = true; // 表示範囲外なら描画せず、範囲内なら描画済みフラグを立てる
        const rawStart = diffDays(start, pStart), rawEnd = diffDays(start, pEnd) + 1; // 表示開始からのオフセット（日数）
        const clampedStart = Math.max(0, rawStart), clampedEnd = Math.min(days, rawEnd); // 表示範囲内にクランプする
        const fullyVisible = (clampedStart === rawStart) && (clampedEnd === rawEnd); // 全部表示されているか
        const hasTime = period.start === period.end && period.startTime && period.endTime; // 時間指定が有効な単日か
        const bar = document.createElement('div'); // バー要素
        bar.className = `gantt-bar ${trackClass} pri-${item.priority} ${item.status === '完了' ? 'done' : ''} ${kind === 'detail' ? 'detail-bar' : ''}`; // クラスを設定する（計画/実績のトラック区別クラスも付与する）
        bar.style.position = 'absolute'; bar.style.left = `${clampedStart * colWidth}px`; bar.style.width = `${(clampedEnd - clampedStart) * colWidth}px`; bar.style.top = `${topPx}px`; bar.style.height = '20px'; bar.style.margin = '0'; // レーン内の絶対配置(px)で日付範囲を表現する
        const trackLabel = periodsField === 'actualPeriods' ? '実績' : '計画'; // ツールチップ用のトラック名
        bar.title = `${item.title}（${trackLabel}）\n${period.start} 〜 ${period.end}${hasTime ? ` (${period.startTime}-${period.endTime})` : ''}\n優先度:${item.priority} / ${item.status}${item.ganttOnly ? '\n（リスト表示には出ません）' : ''}`; // トラック名を含めたツールチップ内容にする
        bar.textContent = colWidth < 16 ? '' : `${hasTime ? '🕐 ' : ''}${item.title}`; // バー内テキスト
        bar.style.cursor = fullyVisible ? 'grab' : 'default'; // カーソル形状
        bar.tabIndex = 0; // フォーカスで備考を確認できるようにする
        if(item.description){ // 備考がある場合のみフォーカス/ホバーでツールチップを表示する
          bar.addEventListener('focus', () => showDescTooltipNear(bar, item.description)); // フォーカス時に表示する
          bar.addEventListener('mouseenter', () => showDescTooltipNear(bar, item.description)); // マウスホバー時にも表示する
          bar.addEventListener('blur', hideDescTooltip); // フォーカスが外れたら隠す
          bar.addEventListener('mouseleave', hideDescTooltip); // マウスが離れたら隠す
        }
        if(fullyVisible) attachDateBarDragHandlers(bar, item, period, periodIndex, kind, start, days, colWidth, periodsField); // 全表示ならドラッグを有効化する（計画/実績どちらを動かすかをperiodsFieldで区別する）
        else bar.addEventListener('contextmenu', e => { e.preventDefault(); openItemModal(item, kind); }); // 一部表示なら右クリック編集のみにする
        lane.appendChild(bar); // レーンにバーを追加する
      }
      item.periods.forEach((p, i) => placeBar(p, i, 'track-plan', 2, 'periods')); // 計画期間を上段(2px始まり)に描画する
      item.actualPeriods.forEach((p, i) => placeBar(p, i, 'track-actual', 26, 'actualPeriods')); // 実績期間を下段(26px始まり)に描画する
      grid.appendChild(lane); // レーンを日付グリッドに追加する
      if(!anyVisible){ const range = getItemRange(item); const out = document.createElement('div'); out.className = 'gantt-out-of-range'; out.style.gridRow = String(gridRowNum); out.style.gridColumn = `1 / ${1 + days}`; out.textContent = range.start > toDateStr(viewEnd) ? '表示期間より後' : '表示期間より前'; grid.appendChild(out); } // 表示範囲外の場合の案内（列範囲も1〜に変更する）
    }
  });
}
function attachDateBarDragHandlers(bar, item, period, periodIndex, kind, viewStart, days, colWidth, periodsField){ // バーにイベントを付与する（periodsFieldで計画/実績のどちらを操作するか区別する）
  bar.addEventListener('contextmenu', e => { e.preventDefault(); openItemModal(item, kind); }); // 右クリックで編集を開く
  bar.addEventListener('mousemove', e => { if(dragState) return; const rect = bar.getBoundingClientRect(); const offsetX = e.clientX - rect.left; bar.style.cursor = (offsetX <= RESIZE_HANDLE_PX || offsetX >= rect.width - RESIZE_HANDLE_PX) ? 'ew-resize' : 'grab'; }); // カーソル形状の切り替え
  bar.addEventListener('mousedown', e => { // ドラッグ開始処理
    if(e.button !== 0) return; e.preventDefault(); // 左クリックのみ対象
    const rect = bar.getBoundingClientRect(); const offsetX = e.clientX - rect.left; // クリック位置
    let mode = 'move'; if(offsetX <= RESIZE_HANDLE_PX) mode = 'resize-left'; else if(offsetX >= rect.width - RESIZE_HANDLE_PX) mode = 'resize-right'; // モード判定
    const origStartOffset = diffDays(viewStart, parseDateStr(period.start)); const origEndOffset = diffDays(viewStart, parseDateStr(period.end)); // 元のオフセット
    dragState = { kind: 'date', mode, item, itemKind: kind, period, periodIndex, periodsField, viewStart, days, colWidth, startX: e.clientX, origStartOffset, origEndOffset, currentStartOffset: origStartOffset, currentEndOffset: origEndOffset, bar }; // periodsFieldをドラッグ状態に保持し、確定時にどちらの配列を更新するか判別できるようにする
    document.body.classList.add('dragging-gantt'); // ドラッグ中クラスを付与する
  });
}
function handleDateDragMove(e){ // ドラッグ中の見た目更新
  const ds = dragState; const deltaPx = e.clientX - ds.startX; const deltaDays = Math.round(deltaPx / ds.colWidth); // 移動量を日数に変換する
  let newStartOffset = ds.origStartOffset, newEndOffset = ds.origEndOffset; // 新しいオフセットの初期値
  if(ds.mode === 'move'){ const minDelta = -ds.origStartOffset; const maxDelta = (ds.days - 1) - ds.origEndOffset; const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaDays)); newStartOffset = ds.origStartOffset + clampedDelta; newEndOffset = ds.origEndOffset + clampedDelta; } // 平行移動
  else if(ds.mode === 'resize-left'){ newStartOffset = Math.max(0, Math.min(ds.origEndOffset, ds.origStartOffset + deltaDays)); newEndOffset = ds.origEndOffset; } // 開始側リサイズ
  else if(ds.mode === 'resize-right'){ newEndOffset = Math.min(ds.days - 1, Math.max(ds.origStartOffset, ds.origEndOffset + deltaDays)); newStartOffset = ds.origStartOffset; } // 終了側リサイズ
  ds.currentStartOffset = newStartOffset; ds.currentEndOffset = newEndOffset; // 現在値を保存する
  ds.bar.style.left = `${newStartOffset * ds.colWidth}px`; ds.bar.style.width = `${(newEndOffset - newStartOffset + 1) * ds.colWidth}px`; // 絶対配置(px)に合わせて見た目を更新する
  const trackLabel = ds.periodsField === 'actualPeriods' ? '実績' : '計画'; // ツールチップに計画/実績のどちらを動かしているか表示する
  showDragTooltip(e.clientX, e.clientY, `${trackLabel}: ${toDateStr(addDays(ds.viewStart, newStartOffset))} 〜 ${toDateStr(addDays(ds.viewStart, newEndOffset))}`); // ツールチップを更新する
}
function commitItemUpdate(item, kind){ // 更新後の正規化・配列反映を行う共通処理
  if(kind === 'sub'){ const idx = subTasks.findIndex(s => s.id === item.id); if(idx >= 0) subTasks[idx] = normalizeSubTask({ ...subTasks[idx], updatedAt: new Date().toISOString() }); } // サブタスクを更新する
  else { const idx = detailTasks.findIndex(d => d.id === item.id); if(idx >= 0) detailTasks[idx] = normalizeDetailTask({ ...detailTasks[idx], updatedAt: new Date().toISOString() }); } // ディテールタスクを更新する
}
function commitDateDrag(){ // ドラッグ結果をデータへ反映する
  const ds = dragState; const newStart = toDateStr(addDays(ds.viewStart, ds.currentStartOffset)); const newEnd = toDateStr(addDays(ds.viewStart, ds.currentEndOffset)); // 確定後の日付
  const deltaDays = ds.currentStartOffset - ds.origStartOffset; // シフトした日数差
  if(newStart === ds.period.start && newEnd === ds.period.end) return; // 変化が無ければ何もしない
  const targetArray = ds.item[ds.periodsField]; // 計画(periods)か実績(actualPeriods)か、対象の配列を選び出す
  if(ds.mode === 'move' && els.chkLinkedShift.checked) ds.item[ds.periodsField] = targetArray.map(p => ({ start: toDateStr(addDays(parseDateStr(p.start), deltaDays)), end: toDateStr(addDays(parseDateStr(p.end), deltaDays)), startTime: p.startTime, endTime: p.endTime })); // 同じトラック内の全期間連動シフト
  else ds.item[ds.periodsField] = targetArray.map((p, i) => i === ds.periodIndex ? { ...p, start: newStart, end: newEnd } : p); // 対象期間のみ更新する
  commitItemUpdate(ds.item, ds.itemKind); scheduleSave(); renderAll(); // 反映・保存・再描画する
}

// ===== ガントチャート描画（日(時間)ビュー） =====
function renderGanttHourView(){ // 特定1日を24時間で表示するビューを描画する
  const hourWidth = 50, hours = 24, start = ganttHourDay; // 基本設定
  const grid = els.ganttGrid; grid.innerHTML = ''; grid.style.gridTemplateColumns = `repeat(${hours}, ${hourWidth}px)`; // ここを修正：グリッドは時間列のみで構成する（タスク名列はganttLabelPaneへ分離し、他のズーム（週/月/四半期/年）と同じ構造に統一した）
  const labelPane = els.ganttLabelPane; labelPane.innerHTML = ''; labelPane.style.width = `${GANTT_LABEL_WIDTH_PX}px`; // ここを追加：ラベルペインをクリアし、幅を定数から設定する（直前のズームの内容が残ったまま表示される「タスク名が別途表示される」問題を解消する）
  const labelHead = document.createElement('div'); labelHead.className = 'gantt-head-label'; labelHead.style.height = `${GANTT_HEAD_ROW1_PX + GANTT_HEAD_ROW2_PX}px`; labelHead.textContent = 'タスク名'; labelPane.appendChild(labelHead); // ここを修正：左上見出しは他のズームと同じく「タスク名」の固定文言にする（日付・曜日はここではなく下記の日付見出し行へ移した）。高さは日付行・時間行の2段分に合わせる

  // --- 日付・曜日ラベル行（時間ラベル行の1段上に配置し、24時間分すべてにまたがる見出しにする） ---
  const dateHead = document.createElement('div'); // ここを追加：日付・曜日を表示する見出しセル
  dateHead.className = 'gantt-head-month'; // ここを追加：月ラベル行と同じ見た目（複数列にまたがる1段目の見出し）を流用し、他ズームの1段目と統一する
  dateHead.style.gridRow = '1'; dateHead.style.gridColumn = `1 / ${1 + hours}`; // ここを追加：時間列24列すべてにまたがって配置する（「日付は時間の上に配置」の要望に対応する）
  dateHead.style.height = `${GANTT_HEAD_ROW1_PX}px`; dateHead.style.top = '0px'; // ここを追加：高さと固定位置を他ズームの1段目に揃える
  dateHead.textContent = `${toDateStr(start)}（${getWeekdayInfo(start).text}）`; // ここを追加：日付と曜日を表示する
  grid.appendChild(dateHead); // ここを追加：グリッドに追加する

  // --- 時間ラベル行（0時〜23時、日付行の下の2段目） ---
  const isToday = toDateStr(start) === todayStr(); const nowHour = new Date().getHours(); // 今日かどうかと現在の時
  for(let h = 0; h < 24; h++){ const cell = document.createElement('div'); cell.className = 'gantt-head-cell'; if(isToday && h === nowHour) cell.classList.add('today-col'); cell.style.gridRow = '2'; cell.style.gridColumn = String(h + 1); cell.style.height = `${GANTT_HEAD_ROW2_PX}px`; cell.style.top = `${GANTT_HEAD_ROW1_PX}px`; cell.textContent = `${h}時`; grid.appendChild(cell); } // ここを修正：gridRowを'1'から'2'へ、gridColumnのオフセットを(h+2)から(h+1)へ変更した（タスク名列がグリッドから無くなり、日付行が1段目に入ったため）。topも日付行の高さぶん下にずらす
  const dayStr = toDateStr(start); // 表示中の日付文字列
  const rows = buildVisibleRows().filter(row => (row.kind === 'folder' || row.kind === 'main') ? true : (row.node.periods.some(p => p.start <= dayStr && p.end >= dayStr) || row.node.actualPeriods.some(p => p.start <= dayStr && p.end >= dayStr))); // 計画・実績のいずれかがこの日に該当する行を表示対象にする
  let anyRendered = false; // サブタスク/ディテールタスクが1件でも表示できたかを記録するフラグ
  rows.forEach((row, rowIdx) => { // 各行をラベルペイン側・時間グリッド側の両方に、同じ順番・同じ高さで描画する
    if(row.kind === 'sub' || row.kind === 'detail') anyRendered = true; // 実データ行が存在したことを記録する
    const gridRowNum = rowIdx + 3; // ここを修正：ヘッダーが2行（日付行・時間行）になったため、避ける行数を1から2に増やした
    const isAltRow = rowIdx % 2 === 1; // 1行おきの縞模様にするため、行番号が奇数かどうかを判定する
    const rowHeight = row.kind === 'folder' ? GANTT_ROW_FOLDER_PX : (row.kind === 'main' ? GANTT_ROW_MAIN_PX : GANTT_ROW_TASK_PX); // ここを追加：他のズームと同じ基準で行の高さを決定し、ラベル側と時間グリッド側の両方に同じ値を反映させる
    const label = renderRowLabel(row); label.style.height = `${rowHeight}px`; label.classList.toggle('gantt-row-alt', isAltRow); labelPane.appendChild(label); // ここを修正：行ラベルはグリッドではなくlabelPaneに追加する（グリッド内に重複して表示されていた問題を解消する）
    for(let h = 0; h < hours; h++){ const cell = document.createElement('div'); cell.className = 'gantt-day-cell'; if(isToday && h === nowHour) cell.classList.add('today-col'); cell.classList.toggle('gantt-row-alt', isAltRow); cell.style.gridRow = String(gridRowNum); cell.style.gridColumn = String(h + 1); cell.style.height = `${rowHeight}px`; grid.appendChild(cell); } // ここを修正：gridColumnのオフセットを(h+2)から(h+1)へ変更し、行の高さも明示的に指定してラベル側と一致させる
    const lane = document.createElement('div'); lane.style.gridRow = String(gridRowNum); lane.style.gridColumn = `1 / ${1 + hours}`; lane.style.position = 'relative'; lane.style.height = `${rowHeight}px`; // ここを修正：列範囲のオフセットを(2〜)から(1〜)へ変更し、高さも明示的に指定する
    if(row.kind === 'main'){ lane.classList.add('gantt-overall-row'); } else { lane.classList.add('gantt-task-lane'); } // メインタスクは全体行スタイル(44px)、サブ/ディテールは2段レーンスタイル(48px)を適用する
    lane.classList.toggle('gantt-row-alt', isAltRow); // レーンにも縞模様クラスを適用する
    if(row.kind === 'main'){ // メインタスク行なら全体ラインとマイルストーンを描画する
      lane.addEventListener('contextmenu', e => { e.preventDefault(); openMainTaskModalForEdit(row.node.id); }); // 全体行の右クリックでメインタスク編集を開く
      const line = document.createElement('div'); line.className = 'gantt-overall-line'; lane.appendChild(line); // 矢印ラインを追加する
      milestones.filter(mi => mi.mainTaskId === row.node.id && mi.date === dayStr).forEach((mi, idx) => { // この日に該当するマイルストーンだけを描画する
        const marker = document.createElement('div'); marker.className = 'milestone-marker ' + (idx % 2 === 0 ? 'label-top' : 'label-bottom'); marker.style.left = `${hourWidth * 12}px`; // 便宜上正午の位置に表示する
        const shapeChar = { diamond: '◆', star: '★', circle: '●' }[mi.shape]; // 形状文字
        marker.innerHTML = `${shapeChar}<span class="m-label-text">${escapeHtml(mi.label)}</span>`; lane.appendChild(marker); // マーカーを追加する
      });
    } else if(row.kind === 'sub' || row.kind === 'detail'){ // サブタスク／ディテールタスク行なら計画・実績の2段バーを描画する
      const item = row.node, kind = row.kind; // 対象アイテムと種別
      function placeHourBar(period, periodIndex, trackClass, topPx, periodsField){ // 計画/実績どちらのバーも共通の手順で配置する内部関数
        if(!(period.start <= dayStr && period.end >= dayStr)) return; // 表示中の日を含まない期間は描画しない
        const isSingleDay = period.start === period.end; // 単日期間かどうか
        const hasTime = isSingleDay && period.startTime && period.endTime; // 時刻指定が有効かどうか
        const startMin = hasTime ? timeStrToMinutes(period.startTime) : 0; // 開始分
        const endMin = hasTime ? timeStrToMinutes(period.endTime) : 24 * 60; // 終了分
        const startCol = startMin / 60; const endCol = endMin / 60; // 列相当の位置
        const bar = document.createElement('div'); // バー要素
        bar.className = `gantt-bar ${trackClass} pri-${item.priority} ${item.status === '完了' ? 'done' : ''} ${kind === 'detail' ? 'detail-bar' : ''}`; // クラスを設定する（計画/実績のトラック区別クラスも付与する）
        bar.style.position = 'absolute'; bar.style.left = `${startCol * hourWidth}px`; bar.style.width = `${(endCol - startCol) * hourWidth}px`; bar.style.top = `${topPx}px`; bar.style.height = '20px'; bar.style.margin = '0'; // レーン内の絶対配置で時間帯と上下段を表現する
        const trackLabel = periodsField === 'actualPeriods' ? '実績' : '計画'; // ツールチップ用のトラック名
        bar.title = `${item.title}（${trackLabel}）\n${period.start} 〜 ${period.end}${hasTime ? ` (${period.startTime}-${period.endTime})` : ''}\n優先度:${item.priority} / ${item.status}${item.ganttOnly ? '\n（リスト表示には出ません）' : ''}`; // トラック名を含めたツールチップ内容にする
        bar.textContent = `${hasTime ? '🕐 ' : ''}${item.title}`; // バー内テキスト
        bar.style.cursor = 'grab'; // ドラッグ可能カーソル
        bar.tabIndex = 0; // フォーカスで備考を確認できるようにする
        if(item.description){ // 備考がある場合のみフォーカス/ホバーでツールチップを表示する
          bar.addEventListener('focus', () => showDescTooltipNear(bar, item.description)); // フォーカス時に表示する
          bar.addEventListener('mouseenter', () => showDescTooltipNear(bar, item.description)); // マウスホバー時にも表示する
          bar.addEventListener('blur', hideDescTooltip); // フォーカスが外れたら隠す
          bar.addEventListener('mouseleave', hideDescTooltip); // マウスが離れたら隠す
        }
        attachHourBarDragHandlers(bar, item, period, periodIndex, kind, start, hourWidth, periodsField); // ドラッグ・リサイズを紐づける（periodsFieldで計画/実績を区別する）
        lane.appendChild(bar); // バーをレーンに追加する
      }
      item.periods.forEach((p, i) => placeHourBar(p, i, 'track-plan', 2, 'periods')); // 計画期間を上段に描画する
      item.actualPeriods.forEach((p, i) => placeHourBar(p, i, 'track-actual', 26, 'actualPeriods')); // 実績期間を下段に描画する
    }
    grid.appendChild(lane); // レーンを時間グリッドに追加する
  });
  if(!anyRendered){ const msg = document.createElement('div'); msg.className = 'empty-message'; msg.style.gridRow = '3'; msg.style.gridColumn = `1 / ${1 + hours}`; msg.textContent = 'この日に該当するタスクがありません。'; grid.appendChild(msg); } // ここを修正：ヘッダーが2行になったためgridRowを'2'から'3'へ、タスク名列が無くなったためgridColumnの範囲を`1 / ${1 + hours}`へ変更した
}
function attachHourBarDragHandlers(bar, item, period, periodIndex, kind, viewDay, hourWidth, periodsField){ // バーにイベントを付与する（periodsFieldで計画/実績のどちらを操作するか区別する）
  bar.addEventListener('contextmenu', e => { e.preventDefault(); openItemModal(item, kind); }); // 右クリックで編集を開く
  bar.addEventListener('mousemove', e => { if(dragState) return; const rect = bar.getBoundingClientRect(); const offsetX = e.clientX - rect.left; bar.style.cursor = (offsetX <= RESIZE_HANDLE_PX || offsetX >= rect.width - RESIZE_HANDLE_PX) ? 'ew-resize' : 'grab'; }); // カーソル形状の切り替え
  bar.addEventListener('mousedown', e => { // ドラッグ開始処理
    if(e.button !== 0) return; e.preventDefault(); // 左クリックのみ対象
    const rect = bar.getBoundingClientRect(); const offsetX = e.clientX - rect.left; // クリック位置
    let mode = 'move'; if(offsetX <= RESIZE_HANDLE_PX) mode = 'resize-left'; else if(offsetX >= rect.width - RESIZE_HANDLE_PX) mode = 'resize-right'; // モード判定
    const isSingleDay = period.start === period.end; const hasTime = isSingleDay && period.startTime && period.endTime; // 単日・時刻指定の判定
    const origStartMin = hasTime ? timeStrToMinutes(period.startTime) : 0; const origEndMin = hasTime ? timeStrToMinutes(period.endTime) : 24 * 60; // 元の開始/終了分
    dragState = { kind: 'hour', mode, item, itemKind: kind, period, periodIndex, periodsField, viewDay, hourWidth, startX: e.clientX, origStartMin, origEndMin, currentStartMin: origStartMin, currentEndMin: origEndMin, wasAllDay: !hasTime, bar }; // periodsFieldをドラッグ状態に保持する
    document.body.classList.add('dragging-gantt'); // ドラッグ中クラスを付与する
  });
}
function snapMinutes(min){ return Math.round(min / HOUR_SNAP_MINUTES) * HOUR_SNAP_MINUTES; } // 分を30分単位にスナップする
function handleHourDragMove(e){ // ドラッグ中の見た目更新
  const ds = dragState; const deltaPx = e.clientX - ds.startX; const deltaMin = snapMinutes((deltaPx / ds.hourWidth) * 60); // 移動量を分に変換する
  let newStartMin = ds.origStartMin, newEndMin = ds.origEndMin; // 新しい開始/終了分の初期値
  if(ds.mode === 'move'){ const minDelta = -ds.origStartMin; const maxDelta = (24 * 60) - ds.origEndMin; const clampedDelta = Math.max(minDelta, Math.min(maxDelta, deltaMin)); newStartMin = ds.origStartMin + clampedDelta; newEndMin = ds.origEndMin + clampedDelta; } // 平行移動
  else if(ds.mode === 'resize-left'){ newStartMin = Math.max(0, Math.min(ds.origEndMin - HOUR_SNAP_MINUTES, ds.origStartMin + deltaMin)); newEndMin = ds.origEndMin; } // 開始側リサイズ
  else if(ds.mode === 'resize-right'){ newEndMin = Math.min(24 * 60, Math.max(ds.origStartMin + HOUR_SNAP_MINUTES, ds.origEndMin + deltaMin)); newStartMin = ds.origStartMin; } // 終了側リサイズ
  ds.currentStartMin = newStartMin; ds.currentEndMin = newEndMin; // 現在値を保存する
  ds.bar.style.left = `${(newStartMin / 60) * ds.hourWidth}px`; ds.bar.style.width = `${((newEndMin - newStartMin) / 60) * ds.hourWidth}px`; // 見た目を更新する
  const trackLabel = ds.periodsField === 'actualPeriods' ? '実績' : '計画'; // ツールチップに計画/実績のどちらを動かしているか表示する
  showDragTooltip(e.clientX, e.clientY, `${trackLabel}: ${minutesToTimeStr(newStartMin)} 〜 ${minutesToTimeStr(newEndMin)}`); // ツールチップを更新する
}
function commitHourDrag(){ // ドラッグ結果をデータへ反映する
  const ds = dragState; const newStartTime = minutesToTimeStr(ds.currentStartMin); const newEndTime = minutesToTimeStr(ds.currentEndMin); // 確定後の時刻文字列
  const isFullDay = ds.currentStartMin === 0 && ds.currentEndMin === 24 * 60; // 終日相当かどうか
  const targetArray = ds.item[ds.periodsField]; // 計画(periods)か実績(actualPeriods)か、対象の配列を選び出す
  ds.item[ds.periodsField] = targetArray.map((p, i) => { if(i !== ds.periodIndex) return p; if(isFullDay) return { start: p.start, end: p.end, startTime: '', endTime: '' }; return { start: p.start, end: p.end, startTime: newStartTime, endTime: newEndTime }; }); // 対象期間の時刻を更新する
  commitItemUpdate(ds.item, ds.itemKind); scheduleSave(); renderAll(); // 反映・保存・再描画する
}

// ===== ドラッグ操作のキャンセル（Escapeキー押下時） =====
function cancelDrag(){ // ドラッグ操作をキャンセルして元の見た目に戻す
  const ds = dragState; if(!ds) return; // ドラッグ中でなければ何もしない
  if(ds.kind === 'date'){ ds.bar.style.left = `${ds.origStartOffset * ds.colWidth}px`; ds.bar.style.width = `${(ds.origEndOffset - ds.origStartOffset + 1) * ds.colWidth}px`; } // 絶対配置(px)に合わせて元の見た目に戻す
  else if(ds.kind === 'hour'){ ds.bar.style.left = `${(ds.origStartMin / 60) * ds.hourWidth}px`; ds.bar.style.width = `${((ds.origEndMin - ds.origStartMin) / 60) * ds.hourWidth}px`; } // 時間ビューの見た目を元に戻す
  dragState = null; document.body.classList.remove('dragging-gantt'); hideDragTooltip(); // 状態解除・クラス除去・ツールチップ非表示
}

// ===== ガントチャートの左右ペイン高さズレ補正（横スクロールバーの太さぶんラベルペインの下端に余白を足す） =====
function syncGanttPaneScrollbarGap(){
  const scrollbarH = els.ganttScrollPane.offsetHeight - els.ganttScrollPane.clientHeight; // グリッド側の横スクロールバーが占めている高さを実測する（無ければ0になる）
  els.ganttLabelPane.style.paddingBottom = `${scrollbarH}px`; // ラベル側の下端に同じ高さの余白を足し、maxScrollTop（スクロールできる最大量）をグリッド側と一致させる
}

// ===== ガントチャートのズーム・振り分け・移動 =====
function renderGanttSection(){ 
  if(ganttZoom === 'hour') renderGanttHourView(); 
  else renderGanttDateView(); 
  syncGanttPaneScrollbarGap(); // 追加：グリッドの再描画が終わった直後に、横スクロールバーの太さぶんラベルペイン側の余白を再計算し、最下部までスクロールした際のズレを防ぐ
} // ズームに応じて描画関数を振り分ける（ペイン分離方式にしたため、JSによる横位置補正は不要になった）
function setZoom(zoom){ // ズームレベルを切り替える
  ganttZoom = zoom; // 選択されたズームレベルを保存する
  document.querySelectorAll('.zoom-btn').forEach(b => b.classList.toggle('active', b.dataset.zoom === zoom)); // ボタンの選択状態を更新する
  if(zoom === 'hour'){ ganttHourDay = startOfDay(new Date()); } // ここを修正：日(時間)ズームに切り替えた際は、全タスクが収まる位置ではなく「今日」の日付をそのまま表示するようにした
  else if(zoom === 'week'){ ganttViewStart = startOfWeekMonday(new Date()); } // ここを修正：週ズームに切り替えた際は、直前の表示位置や全体表示ではなく「今日」を含む週の月曜日を表示するようにした（月曜始まりの仕様自体は維持する）
  else if(zoom === 'month'){ ganttViewStart = startOfMonth(new Date()); } // ここを修正：月ズームに切り替えた際は、全タスクが収まる位置ではなく「今日」を含む月の1日を表示するようにした（1日始まりの仕様自体は維持する）
  else if(zoom === 'quarter'){ ganttViewStart = startOfQuarter(new Date()); } // ここを修正：四半期ズームに切り替えた際は、直前の表示位置ではなく「今日」を含む四半期の開始月の1日を表示するようにした
  else { ganttViewStart = startOfYear(new Date()); } // ここを修正：年ズームに切り替えた際は、直前の表示位置ではなく「今日」を含む年の1月1日を表示するようにした
  renderGanttSection(); // ここを修正：どのズームでも最後に必ず1回だけ再描画するよう共通化した（従来はズームごとにfitGanttToTasksとrenderGanttSectionを個別に呼び分けていたが、全て「今日基準」に統一したため不要になった）
}
function shiftGanttView(dir){ // dir: -1（前へ）または 1（次へ）
  if(ganttZoom === 'hour'){ ganttHourDay = addDays(ganttHourDay, dir); } // 時間ビューは1日単位で移動する
  else if(ganttZoom === 'week'){ ganttViewStart = addDays(ganttViewStart, 7 * dir); } // 週ビューは7日固定で移動し、月曜始まりの位置がそのまま保たれる
  else if(ganttZoom === 'month'){ const base = startOfMonth(ganttViewStart); ganttViewStart = new Date(base.getFullYear(), base.getMonth() + dir, 1); } // 月ビューは現在位置が属する月の1日を基準に、ちょうど1か月分だけ前後の月の1日へ移動する
  else if(ganttZoom === 'quarter'){ const base = startOfQuarter(ganttViewStart); ganttViewStart = new Date(base.getFullYear(), base.getMonth() + 3 * dir, 1); } // 四半期ビューは現在位置が属する四半期の開始月の1日を基準に、ちょうど3か月分だけ前後の四半期へ移動する
  else { const base = startOfYear(ganttViewStart); ganttViewStart = new Date(base.getFullYear() + dir, 0, 1); } // 年ビューは現在位置が属する年の1月1日を基準に、ちょうど1年分だけ前後の年へ移動する
  renderGanttSection(); // 移動後の範囲で再描画する
}
function resetGanttToToday(){ // 今日を基準に戻す（月/四半期/年ビューでは月初等に丸めず「今日」自体を先頭列にする）
  if(ganttZoom === 'hour') ganttHourDay = startOfDay(new Date()); // 時間ビューは今日そのものに戻す
  else if(ganttZoom === 'week') ganttViewStart = startOfWeekMonday(new Date()); // 週ビューは今日を含む週の月曜日に戻す（月曜始まり仕様を維持する）
  else ganttViewStart = startOfDay(new Date()); // 月/四半期/年ビューは、月初・四半期初・年始に丸めず「今日」をそのまま表示開始日(先頭列)にする
  renderGanttSection(); // 再描画する
}
function fitGanttToTasks(){ // 表示中のサブタスク・ディテールタスクが収まるようにビューを調整する（対象が無い場合も必ず再描画する）
  const combined = [...getSortedSubTasks(), ...getSortedDetailTasks()]; // 絞り込み後のサブタスク・ディテールタスクをすべて取得する
  if(combined.length > 0){ // 対象タスクが1件以上ある場合のみ表示開始位置を調整する
    let minStart = null, maxEnd = null; // 全体の最小開始日・最大終了日
    combined.forEach(item => item.periods.forEach(p => { if(!minStart || p.start < minStart) minStart = p.start; if(!maxEnd || p.end > maxEnd) maxEnd = p.end; })); // すべての計画期間を走査して最小開始日・最大終了日を求める
    if(ganttZoom === 'hour'){ ganttHourDay = parseDateStr(minStart); } // 時間ビューなら最初の日に移動する
    else if(ganttZoom === 'week'){ ganttViewStart = startOfWeekMonday(parseDateStr(minStart)); } // 週ビューは最初の日を含む週の月曜日に揃える
    else { // 月/四半期/年ビューはそれぞれの単位の開始境界に先頭列を揃える
      if(ganttZoom === 'month') ganttViewStart = startOfMonth(parseDateStr(minStart)); // 月ビューは最初の日を含む月の1日に揃える
      else if(ganttZoom === 'quarter') ganttViewStart = startOfQuarter(parseDateStr(minStart)); // 四半期ビューは最初の日を含む四半期の開始月の1日に揃える
      else ganttViewStart = startOfYear(parseDateStr(minStart)); // 年ビューは最初の日を含む年の1月1日に揃える
      const spanDays = diffDays(ganttViewStart, parseDateStr(maxEnd)) + 1; // 揃えた開始日から最終日までの日数を求める
      const yearViewDays = getGanttDateViewDays('year', ganttViewStart); // ここを修正：固定値のZOOM_PRESETS.year.daysではなく、実際の年表示日数（うるう年等を考慮した実日数+7バッファ）を動的に求める
      if(spanDays > yearViewDays) alert('期間が非常に長いため、一部が表示範囲外になる場合があります。ズームを「年」にしてください。'); // 表示可能な最大日数を超える場合は案内する
    }
  } // 対象タスクが無い場合は表示開始位置を変更せず、現在の位置のまま次の描画に進む
  renderGanttSection(); // 対象の有無にかかわらず必ず再描画する
}
//----------------------------------------------------------------------------------------------------------------------------------------------------
//ガントチャート処理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//業務余力処理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== 業務余力可視化ビューの絞り込み済みタスク取得 =====
function getWorkloadFilteredItems(){ // 上部の絞り込み・検索条件を適用したサブタスク・ディテールタスクをまとめて返す共通処理（範囲算出・集計の両方で使う）
  return [...subTasks.filter(matchesFilter).filter(s => !s.excludeFromWorkload).map(s => ({ item: s, kind: 'sub' })), ...detailTasks.filter(matchesFilter).filter(d => !d.excludeFromWorkload).map(d => ({ item: d, kind: 'detail' }))]; // ganttOnlyでも実際の稼働として集計対象にするが、excludeFromWorkloadがtrueのタスクは業務余力の集計・範囲算出・下部一覧から除外する
}

// ===== 業務余力ビュー：「すべて」ズームの表示日数を確定する処理 =====
function fitWorkloadToAll(){ // 絞り込み条件に一致する全タスクの計画期間がちょうど収まるよう、表示開始日と日数を確定する
  const combined = getWorkloadFilteredItems(); // 絞り込み後の全タスクを取得する
  if(combined.length === 0){ workloadAllDays = WORKLOAD_ZOOM_PRESETS.month.days; workloadViewStart = startOfDay(new Date()); return; } // 対象が無い場合は月表示相当にフォールバックする
  let minStart = null, maxEnd = null; // 全体の最小開始日・最大終了日
  combined.forEach(({ item }) => item.periods.forEach(p => { if(!minStart || p.start < minStart) minStart = p.start; if(!maxEnd || p.end > maxEnd) maxEnd = p.end; })); // すべての計画期間を走査する
  workloadViewStart = parseDateStr(minStart); // 表示開始日を全タスクの最小開始日に合わせる
  workloadAllDays = diffDays(parseDateStr(minStart), parseDateStr(maxEnd)) + 1; // 全期間がちょうど収まる日数を確定する（この後は前/次ボタンで移動してもズームを切替直すまで固定する）
}

// ===== 業務余力ビュー：現在のズームに応じた表示日数と1日あたりの幅(px)を返す =====
function getWorkloadRange(){ // week/month/quarter/yearはプリセットをそのまま使い、allはfitWorkloadToAllで確定した日数を使う
  if(workloadZoom === 'all'){ // 「すべて」ズームの場合
    if(workloadAllDays == null) fitWorkloadToAll(); // 未確定なら算出する（保険的な処理）
    const days = workloadAllDays; // 確定済みの日数
    let colWidth; // 日数に応じて適切な列幅を選ぶ（多いほど狭く、少ないほど広くする）
    if(days <= WORKLOAD_ZOOM_PRESETS.week.days) colWidth = WORKLOAD_ZOOM_PRESETS.week.colWidth; // 週相当以下ならもっとも広い幅
    else if(days <= WORKLOAD_ZOOM_PRESETS.month.days) colWidth = WORKLOAD_ZOOM_PRESETS.month.colWidth; // 月相当以下なら月表示相当の幅
    else if(days <= WORKLOAD_ZOOM_PRESETS.quarter.days) colWidth = WORKLOAD_ZOOM_PRESETS.quarter.colWidth; // 四半期相当以下なら四半期表示相当の幅
    else colWidth = WORKLOAD_ZOOM_PRESETS.year.colWidth; // それ以上は年表示相当の最も狭い幅
    return { days: Math.max(1, days), colWidth }; // 0日以下にならないよう最低1日を保証する
  }
  return WORKLOAD_ZOOM_PRESETS[workloadZoom]; // week/month/quarter/yearはそのままプリセットを返す
}

// ===== 業務余力可視化ビューの集計処理 =====
function computeWorkloadData(days){ // workloadViewStartからdays日分の、日ごとの稼働量（タスク数・工数）と該当タスク一覧を集計する
  const combined = getWorkloadFilteredItems(); // 絞り込み済みのサブタスク・ディテールタスクをまとめて取得する
  const perItem = combined.map(({ item, kind }) => { // 各タスクについて、稼働日集合と1日あたりの工数配分を先に計算しておく
    const activeDates = getItemActiveDatesSet(item); // 計画期間を展開した稼働日(YYYY-MM-DD)の集合
    const activeCount = activeDates.size || 1; // 0除算を避けるため最低1日とみなす
    const perDayEffort = getItemEffort(item) / activeCount; // 工数（人日）を稼働日数で均等に配分した1日あたりの値
    return { item, kind, activeDates, perDayEffort }; // 集計用に必要な情報だけまとめて返す
  });
  const result = []; // 日ごとの結果を格納する配列
  for(let i = 0; i < days; i++){ // 表示日数分繰り返す
    const d = addDays(workloadViewStart, i); const dateStr = toDateStr(d); // 対象日とその文字列
    let count = 0, effort = 0; const items = []; // その日の集計値と該当タスク一覧
    perItem.forEach(p => { if(p.activeDates.has(dateStr)){ count++; effort += p.perDayEffort; items.push({ item: p.item, kind: p.kind }); } }); // その日が稼働日集合に含まれるタスクだけ加算する
    result.push({ date: dateStr, dateObj: d, count, effort, items }); // 1日分の結果を追加する
  }
  return result; // 完成した日別集計配列を返す
}

// ===== 業務余力チャートの描画 =====
function renderWorkloadChart(){ // 日ごとの積み上げ集計を、Y軸目盛り付き・閾値で2色に積み上げた棒グラフとして描画する
  const { days, colWidth } = getWorkloadRange(); // 現在のズームに応じた表示日数と列幅を取得する
  const data = computeWorkloadData(days); // 求めた日数分の集計データを取得する
  const chart = els.workloadChart; chart.innerHTML = ''; // チャート本体を一旦クリアする
  const axis = els.workloadYAxis; axis.innerHTML = ''; // Y軸目盛りエリアを一旦クリアする
  // Y軸の最大値は「Y軸上限」入力欄で閾値とは独立して指定できるようにする。未入力(null)または0以下の場合のみ、従来通り閾値から自動算出する
  const niceMax = (typeof workloadAxisMax === 'number' && workloadAxisMax > 0) ? workloadAxisMax : (workloadThreshold > 0 ? workloadThreshold * WORKLOAD_AXIS_TICK_COUNT / (WORKLOAD_AXIS_TICK_COUNT - 1) : 1); // 手動指定があればそれを優先し、無ければ従来通り閾値からの自動算出にフォールバックする
  for(let t = 0; t <= WORKLOAD_AXIS_TICK_COUNT; t++){ // 0からniceMaxまでを等間隔に分割して目盛りを生成する（Y軸上限を独立指定できるようにしたため、目盛りは閾値と無関係な単純な等分割に戻す）
    const tickValue = (niceMax / WORKLOAD_AXIS_TICK_COUNT) * t; // この目盛りが示す値
    const ratio = tickValue / niceMax; // バーの高さ計算と揃えるための比率(0〜1)
    const bottomPx = WORKLOAD_FOOTER_PX + ratio * WORKLOAD_BAR_MAX_PX; // チャート下端からの位置(px)
    const tickLabel = document.createElement('div'); tickLabel.className = 'workload-axis-tick'; tickLabel.style.bottom = `${bottomPx}px`; tickLabel.textContent = (workloadMode === 'count') ? String(Math.round(tickValue)) : tickValue.toFixed(1); // タスク数は整数、工数は小数1桁で目盛りの数値を表示する
    axis.appendChild(tickLabel); // Y軸エリアに目盛りラベルを追加する
    const gridLine = document.createElement('div'); gridLine.className = 'workload-grid-line' + (t === 0 ? ' zero-line' : ''); gridLine.style.bottom = `${bottomPx}px`; chart.appendChild(gridLine); // 対応する高さにチャート側の基準線も常時表示として追加する（0の位置だけ少し濃い線にする）
  }
  // Y軸上限を閾値と切り離したことで、積み上げの色が切り替わる高さ(閾値)が必ずしも上記の等分割目盛りと一致しなくなったため、閾値の実際の値の高さに専用の破線を追加で描画し、どの高さが閾値なのかを常に明示する
  const thresholdRatio = Math.min(1, Math.max(0, workloadThreshold / niceMax)); // 閾値をniceMaxに対する比率に変換する（Y軸上限が閾値未満に設定された場合は1(上端)に張り付かせる）
  const thresholdBottomPx = WORKLOAD_FOOTER_PX + thresholdRatio * WORKLOAD_BAR_MAX_PX; // 閾値ラインのチャート下端からの位置(px)
  const thresholdLine = document.createElement('div'); thresholdLine.className = 'workload-threshold-line'; thresholdLine.style.bottom = `${thresholdBottomPx}px`; chart.appendChild(thresholdLine); // 閾値の実際の高さを示す破線をチャートに追加する
  const showText = colWidth >= WORKLOAD_TEXT_MIN_COLWIDTH_PX; // 列幅が狭いズーム（四半期・年など）では文字を省略して見た目の崩れを防ぐ
  data.forEach((d, i) => { // 日ごとの列を1つずつ生成する（この内側の処理は変更なし）
    if(i > 0){ // 先頭の列より前には境目線が不要なため、2列目以降にだけ補助線を追加する
      const boundary = document.createElement('div'); boundary.className = 'workload-day-boundary'; // 境目線の要素を作成する
      const isMonthBoundary = d.dateObj.getDate() === 1; // その日が月初(1日)なら月の境目とみなす
      if(isMonthBoundary) boundary.classList.add('month-end'); // 月の境目だけガントチャートと同じ濃い実線クラスを付与する
      const leftPx = WORKLOAD_CHART_PADDING_LEFT_PX + i * (colWidth + WORKLOAD_COL_GAP_PX) - Math.ceil(WORKLOAD_COL_GAP_PX / 2); // 現在の列幅(colWidth)を使って列と列のちょうど中間にあたるx座標を計算する
      boundary.style.left = `${leftPx}px`; // 計算した位置に補助線を配置する
      chart.appendChild(boundary); // チャートに補助線を追加する
    }
    const effortHours = d.effort * 8; // その日に配分された人日を、一覧の工数(H)表示と単位を揃えるため時間(H)に変換する
    const value = workloadMode === 'count' ? d.count : effortHours; // 現在のモードに応じた値（工数ベースは時間(H)換算後の値を使う）
    const normalPortion = Math.min(value, workloadThreshold); // 閾値以下の「平常範囲」の値
    const overPortion = Math.max(0, value - workloadThreshold); // 閾値を超えた「超過分」の値
    const isToday = d.date === todayStr(); // 今日かどうか
    const col = document.createElement('div'); col.className = 'workload-day-col'; // 1日分の列要素
    col.style.width = `${colWidth}px`; // 列幅をズームレベルに応じて動的に設定する
    if(isToday) col.classList.add('today-col'); // 今日を強調する
    if(selectedWorkloadDate === d.date) col.classList.add('selected'); // クリックで選択中の日を強調する
    const track = document.createElement('div'); track.className = 'workload-bar-track'; // バーが下端から積み上がる土台
    const normalHeightPx = niceMax > 0 ? (normalPortion / niceMax) * WORKLOAD_BAR_MAX_PX : 0; // 平常範囲部分の高さ(px)
    const overHeightPx = niceMax > 0 ? (overPortion / niceMax) * WORKLOAD_BAR_MAX_PX : 0; // 超過分部分の高さ(px)
    const normalBar = document.createElement('div'); normalBar.className = 'workload-bar-normal' + (overPortion <= 0 && normalPortion > 0 ? ' is-top' : ''); normalBar.style.height = `${normalHeightPx}px`; track.appendChild(normalBar); // 平常範囲のバー
    if(overPortion > 0){ const overBar = document.createElement('div'); overBar.className = 'workload-bar-over'; overBar.style.height = `${overHeightPx}px`; overBar.style.bottom = `${normalHeightPx}px`; track.appendChild(overBar); } // 超過分がある場合のみ積み上げて描画する
    const dayNum = document.createElement('div'); dayNum.className = 'workload-day-number'; dayNum.textContent = showText ? String(d.dateObj.getDate()) : ''; // 日番号ラベル
    const wd = getWeekdayInfo(d.dateObj); // 曜日情報を取得する
    const weekdayLabel = document.createElement('div'); weekdayLabel.className = 'workload-day-weekday' + ((wd.isSat || wd.isSun) ? ' weekend' : '') + (wd.isSat ? ' sat-text' : '') + (wd.isSun ? ' sun-text' : ''); weekdayLabel.textContent = showText ? wd.text : ''; // 曜日ラベル
    col.appendChild(track); col.appendChild(dayNum); col.appendChild(weekdayLabel); // 列の中に上から順に配置する
    col.title = `${d.date}（${wd.text}）\n${workloadMode === 'count' ? 'タスク数' : '工数(H)'}: ${workloadMode === 'count' ? d.count : effortHours.toFixed(1)}`; // ホバー時の詳細情報（工数ベースは時間(H)表記・小数1桁に統一する）
    col.addEventListener('click', () => { selectedWorkloadDate = (selectedWorkloadDate === d.date) ? null : d.date; renderWorkloadSection(); }); // クリックで選択/解除を切り替える
    chart.appendChild(col); // チャートに列を追加する
  });
  const endBoundary = document.createElement('div'); // 追加：グラフ右端を示す境目線の要素を新規作成する
  endBoundary.className = 'workload-day-boundary'; // 追加：既存の境目線と同じ見た目(CSSクラス)を使う
  const endLeftPx = WORKLOAD_CHART_PADDING_LEFT_PX + days * (colWidth + WORKLOAD_COL_GAP_PX) - Math.ceil(WORKLOAD_COL_GAP_PX / 2); // 追加：最終列の右端にあたるx座標を計算する（列間境目線と同じ計算式をdays番目に適用する）
  endBoundary.style.left = `${endLeftPx}px`; // 追加：計算した位置に右端の境目線を配置する
  chart.appendChild(endBoundary); // 追加：チャートに右端の境目線を追加し、積み上げグラフの終端を明示する
}

// ===== 業務余力ビュー下部のタスク一覧の描画 =====
function renderWorkloadList(){ // 選択中の日、または表示期間全体に応じたタスク一覧を描画する
  const { days } = getWorkloadRange(); // 現在のズームに応じた表示日数を取得する
  const data = computeWorkloadData(days); // 表示期間分の集計データを取得する（該当タスク一覧の取得に使う）
  let targets; // 表示すべき { item, kind } の配列
  if(selectedWorkloadDate){ // 特定の日が選択されている場合
    const dayData = data.find(d => d.date === selectedWorkloadDate); // 該当日の集計データを探す
    targets = dayData ? dayData.items : []; // その日にアクティブなタスクだけに絞り込む
    els.workloadListTitle.textContent = `タスク一覧（${selectedWorkloadDate} にアクティブなタスク）`; // 見出しを選択中の日付入りにする
    els.btnClearWorkloadSelection.hidden = false; // 選択解除ボタンを表示する
  } else { // 特定の日が選択されていない場合
    const rangeStart = toDateStr(workloadViewStart); const rangeEnd = toDateStr(addDays(workloadViewStart, days - 1)); // 表示期間全体の開始/終了
    targets = getWorkloadFilteredItems().filter(({ item }) => { const r = getItemRange(item); return r.start <= rangeEnd && r.end >= rangeStart; }); // 表示期間と計画期間が重なるものだけ残す
    els.workloadListTitle.textContent = 'タスク一覧（表示期間内）'; // 見出しを期間全体向けにする
    els.btnClearWorkloadSelection.hidden = true; // 選択解除ボタンを隠す
  }
  els.workloadMeasureHeaderTh.textContent = (workloadMode === 'effort') ? '工数(H)' : 'タスク数(件)'; // 集計モードに応じて列見出しを「工数(H)」か「タスク数(件)」に切り替える
  els.workloadListBody.innerHTML = ''; // 一旦クリアする
  els.workloadEmptyMessage.hidden = targets.length > 0; // 空の場合のみ案内文を表示する
  targets.sort((a, b) => compareItems(a.item, b.item)); // 上部の並び替えキーと同じ基準で整列する
  targets.forEach(({ item, kind }) => { // 1件ずつ行を作る
    const range = getItemRange(item); // 計画の代表期間を求める
    const planText = formatRangeShort(range.start, range.end); // 短縮フォーマットの計画期間
    const rawPath = kind === 'detail' ? ancestorPathOfDetail(item) : ancestorPathOfSub(item); // 所属パス（末尾に" > "が残った状態）
    const path = trimTrailingArrow(rawPath); // 表示用に末尾の" > "を取り除く
    const nameCellHtml = `<div class="row-title">${escapeHtml(item.title)}</div>${path ? `<div class="row-path">${escapeHtml(path)}</div>` : ''}`; // タスク名・所属パスの2段を組み立てる
    const measureText = (workloadMode === 'effort') ? getItemEffortHours(item).toFixed(1) : '1'; // 工数ベースなら時間(H)換算値、タスク数ベースならこの1行=1タスクを表す「1」を表示する
    const tr = document.createElement('tr'); // 行要素を作成する
    tr.innerHTML = `<td>${nameCellHtml}</td><td class="col-period">${planText}</td><td>${item.priority}</td><td>${item.status}</td><td>${measureText}</td>`; // 集計モードに応じた単位・値を表示する
    els.workloadListBody.appendChild(tr); // テーブルに行を追加する
  });
}
function renderWorkloadSection(){ renderWorkloadChart(); renderWorkloadList(); } // チャートと一覧をまとめて再描画する
function setWorkloadMode(mode){ workloadMode = mode; document.querySelectorAll('.workload-mode-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === mode)); renderWorkloadSection(); } // 集計モード（タスク数/工数）を切り替える
function setWorkloadZoom(zoom){ // 業務余力ビューのズーム（週/月/四半期/年/すべて）を切り替える
  workloadZoom = zoom; // 選択されたズームレベルを保存する
  document.querySelectorAll('.workload-zoom-btn').forEach(b => b.classList.toggle('active', b.dataset.wzoom === zoom)); // ボタンの選択状態を更新する
  selectedWorkloadDate = null; // ズームが変わったら日付選択状態は一旦解除する（表示範囲が変わるため）
  if(zoom === 'all') fitWorkloadToAll(); // 「すべて」選択時はその場で表示開始日と日数を確定する
  renderWorkloadSection(); // 再描画する
}
function shiftWorkloadView(dir){ workloadViewStart = addDays(workloadViewStart, dir); selectedWorkloadDate = null; renderWorkloadSection(); } // dir(-1または1)の日数だけ、ズームレベルに関わらず常に1日単位で表示期間を移動する
function resetWorkloadToday(){ workloadViewStart = startOfDay(new Date()); selectedWorkloadDate = null; if(workloadZoom === 'all') fitWorkloadToAll(); renderWorkloadSection(); } // 今日を起点に戻す（「すべて」ズームの場合は改めて全体範囲を再計算する）
function persistWorkloadThreshold(){ localStorage.setItem(LS_WORKLOAD_THRESHOLD_KEY, String(workloadThreshold)); } // 現在の閾値をlocalStorageへ保存し、ブラウザを閉じても値を保持できるようにする
function persistWorkloadAxisMax(){ localStorage.setItem(LS_WORKLOAD_AXISMAX_KEY, workloadAxisMax == null ? '' : String(workloadAxisMax)); } // 現在のY軸上限をlocalStorageへ保存する（自動設定中は空文字を保存し、次回起動時も自動のままにする）
//----------------------------------------------------------------------------------------------------------------------------------------------------
//業務余力処理用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------


//----------------------------------------------------------------------------------------------------------------------------------------------------
//アプリ初期化・イベント登録用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
// ===== DOM要素キャッシュ =====
function cacheEls(){ // 使用するDOM要素をまとめて取得する
  const ids = [
    'btnOpenMainTaskModal','btnOpenSubTaskModal','btnOpenDetailTaskModal','btnOpenFolderModal','btnOpenMilestoneModal','btnOpenFileModal','btnOpenHelpModal','fileStatus', // タスク管理系ボタン
    'tabList','tabGantt','tabWorkload','filterStatus','sortKey','searchBox', // 表示切替（3タブ）・絞り込み系
    'taskListBody','emptyMessage','viewList','viewGantt','viewWorkload', // リスト・ビュー系（業務余力ビューを追加）
    'itemModalOverlay','itemModalTitle','itemId','itemTitle','itemDescription','itemPriority','itemStatus','itemEffort','itemFormError', // アイテムモーダル基本項目（工数入力欄を追加）
    'itemKindSub','itemKindDetail','itemParentSelect','itemParentFolderGroup','itemParentMainGroup','itemParentSubGroup','itemParentDetailGroup','itemParentSubTaskSelect','itemGanttOnly','itemExcludeFromWorkload', // アイテムモーダル種別・親選択・ガントのみ表示フラグ・業務余力計算除外フラグ
    'periodsContainer','btnAddPeriod','actualPeriodsContainer','btnAddActualPeriod','btnDeleteItemInModal','btnDuplicateItemInModal','btnCancelItemModal','btnSaveItemModal', // アイテムモーダル期間(計画・実績)・操作ボタン（複製ボタンを追加）
    'folderModalOverlay','folderListContainer','folderFilterStatus','folderSearchBox','btnAddFolder','btnCloseFolderModal', // フォルダー管理（一覧・絞り込み・追加）
    'folderItemModalOverlay','folderItemModalTitle','folderId','folderName','folderParentSelect','folderDescription','folderStatus','folderItemFormError','btnCancelFolderItemModal','btnSaveFolderItemModal', // フォルダー追加・編集モーダル
    'mainTaskModalOverlay','mainTaskListContainer','mainTaskFilterStatus','mainTaskSearchBox','btnAddMainTask','btnCloseMainTaskModal', // メインタスク管理（一覧・絞り込み・追加）
    'mainTaskItemModalOverlay','mainTaskItemModalTitle','mainTaskId','mainTaskTitle','mainTaskFolderSelect','mainTaskDescription','mainTaskStatus','mainTaskItemFormError','btnCancelMainTaskItemModal','btnSaveMainTaskItemModal', // メインタスク追加・編集モーダル
    'subTaskModalOverlay','subTaskListContainer','subTaskFilterStatus','subTaskSearchBox','btnAddSubTask','btnCloseSubTaskModal', // サブタスク管理
    'detailTaskModalOverlay','detailTaskListContainer','detailTaskFilterStatus','detailTaskSearchBox','btnAddDetailTask','btnCloseDetailTaskModal', // ディテールタスク管理
    'milestoneModalOverlay','milestoneListContainer','milestoneFilterMainTask','milestoneFilterStatus','milestoneSearchBox','btnAddMilestone','btnCloseMilestoneModal', // マイルストーン管理（一覧・絞り込み・追加）
    'milestoneItemModalOverlay','milestoneItemModalTitle','milestoneId','milestoneLabel','milestoneDate','milestoneShape','milestoneMainTaskSelect','btnCancelMilestoneItemModal','btnSaveMilestoneItemModal', // マイルストーン追加・編集モーダル
    'fileModalOverlay','btnConnectFile','btnReconnectFile','btnExportCsv','importCsvInput','btnCloseFileModal', // ファイル操作
    'helpModalOverlay','btnCloseHelpModal', // ヘルプ
    'ganttGrid','ganttWrapper','ganttLabelPane','ganttScrollPane','btnGanttPrev','btnGanttToday','btnGanttNext','btnGanttFit','chkLinkedShift','chkCollapseAll','dragTooltip','descTooltip', // ガント操作系
    'workloadChart','workloadYAxis','workloadThreshold','workloadAxisMax','btnWorkloadPrev','btnWorkloadToday','btnWorkloadNext','workloadListBody','workloadEmptyMessage','workloadListTitle','btnClearWorkloadSelection','workloadMeasureHeaderTh' // 業務余力ビュー操作系（Y軸目盛りエリアのworkloadYAxisと、Y軸上限入力欄のworkloadAxisMax、一覧の工数/タスク数見出しworkloadMeasureHeaderThを追加した）
  ];
  ids.forEach(id => els[id] = document.getElementById(id)); // 各IDのDOM要素を取得してキャッシュする
}

// ===== イベント登録 =====
function bindEvents(){ // 各種イベントリスナーをまとめて登録する
  els.btnCancelItemModal.addEventListener('click', closeItemModal); // キャンセルボタン（戻り先があれば復帰する）
  els.btnSaveItemModal.addEventListener('click', saveItemFromForm); // 保存ボタン
  els.btnDeleteItemInModal.addEventListener('click', () => { const kind = els.itemModalOverlay.dataset.kind; deleteItemById(els.itemId.value, kind); closeItemModal(); }); // 削除ボタン
  els.btnDuplicateItemInModal.addEventListener('click', duplicateCurrentItem); // 複製ボタン（編集中のタスクを複製して新規タスクとして追加する）
  els.btnAddPeriod.addEventListener('click', () => addPeriodRow(todayStr(), todayStr())); // 計画期間追加ボタン
  els.btnAddActualPeriod.addEventListener('click', () => addActualPeriodRow(todayStr(), todayStr())); // 実績期間追加ボタン
  // els.itemModalOverlay.addEventListener('click', e => { if(e.target === els.itemModalOverlay) closeItemModal(); }); // 外側クリックでは閉じないようにするため無効化した

  // フォルダー管理・フォルダー追加編集
  els.btnOpenFolderModal.addEventListener('click', openFolderModal); // フォルダー管理を開く
  els.btnCloseFolderModal.addEventListener('click', closeFolderModal); // フォルダー管理の閉じるボタン
  // els.folderModalOverlay.addEventListener('click', e => { if(e.target === els.folderModalOverlay) closeFolderModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.btnAddFolder.addEventListener('click', () => openFolderItemModal(null, true)); // 一覧経由なので、閉じた後は一覧へ戻る(true)ようにしてフォルダー新規追加モーダルを開く
  els.btnCancelFolderItemModal.addEventListener('click', closeFolderItemModal); // フォルダー追加・編集のキャンセルボタン
  els.btnSaveFolderItemModal.addEventListener('click', saveFolderItem); // フォルダー追加・編集の保存ボタン
  // els.folderItemModalOverlay.addEventListener('click', e => { if(e.target === els.folderItemModalOverlay) closeFolderItemModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.folderFilterStatus.addEventListener('change', renderFolderList); // フォルダー絞り込み変更時に再描画する
  els.folderSearchBox.addEventListener('input', renderFolderList); // フォルダー検索入力時に再描画する

  // メインタスク管理・メインタスク追加編集
  els.btnOpenMainTaskModal.addEventListener('click', openMainTaskModal); // メインタスク管理を開く
  els.btnCloseMainTaskModal.addEventListener('click', closeMainTaskModal); // メインタスク管理の閉じるボタン
  // els.mainTaskModalOverlay.addEventListener('click', e => { if(e.target === els.mainTaskModalOverlay) closeMainTaskModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.btnAddMainTask.addEventListener('click', () => openMainTaskItemModal(null, true)); // 一覧経由なので、閉じた後は一覧へ戻る(true)ようにしてメインタスク新規追加モーダルを開く
  els.btnCancelMainTaskItemModal.addEventListener('click', closeMainTaskItemModal); // メインタスク追加・編集のキャンセルボタン
  els.btnSaveMainTaskItemModal.addEventListener('click', saveMainTaskItem); // メインタスク追加・編集の保存ボタン
  // els.mainTaskModalOverlay.addEventListener('click', e => { if(e.target === els.mainTaskModalOverlay) closeMainTaskModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.mainTaskFilterStatus.addEventListener('change', renderMainTaskList); // メインタスク絞り込み変更時に再描画する
  els.mainTaskSearchBox.addEventListener('input', renderMainTaskList); // メインタスク検索入力時に再描画する

  // サブタスク管理
  els.btnOpenSubTaskModal.addEventListener('click', openSubTaskModal); // サブタスク管理を開く
  els.btnCloseSubTaskModal.addEventListener('click', closeSubTaskModal); // サブタスク管理の閉じるボタン
  els.btnAddSubTask.addEventListener('click', () => openItemModal(null, 'sub', 'subTaskModalOverlay')); // サブタスク新規作成（保存/キャンセル後はサブタスク管理へ戻る）
  // els.subTaskModalOverlay.addEventListener('click', e => { if(e.target === els.subTaskModalOverlay) closeSubTaskModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.subTaskFilterStatus.addEventListener('change', renderSubTaskList); // サブタスク絞り込み変更時に再描画する
  els.subTaskSearchBox.addEventListener('input', renderSubTaskList); // サブタスク検索入力時に再描画する

  // ディテールタスク管理
  els.btnOpenDetailTaskModal.addEventListener('click', openDetailTaskModal); // ディテールタスク管理を開く
  els.btnCloseDetailTaskModal.addEventListener('click', closeDetailTaskModal); // ディテールタスク管理の閉じるボタン
  els.btnAddDetailTask.addEventListener('click', () => openItemModal(null, 'detail', 'detailTaskModalOverlay')); // ディテールタスク新規作成（保存/キャンセル後はディテールタスク管理へ戻る）
  // els.detailTaskModalOverlay.addEventListener('click', e => { if(e.target === els.detailTaskModalOverlay) closeDetailTaskModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.detailTaskFilterStatus.addEventListener('change', renderDetailTaskList); // ディテールタスク絞り込み変更時に再描画する
  els.detailTaskSearchBox.addEventListener('input', renderDetailTaskList); // ディテールタスク検索入力時に再描画する

  // マイルストーン管理・マイルストーン追加編集
  els.btnOpenMilestoneModal.addEventListener('click', openMilestoneModal); // マイルストーン管理を開く
  els.btnCloseMilestoneModal.addEventListener('click', closeMilestoneModal); // 閉じるボタン
  // els.milestoneModalOverlay.addEventListener('click', e => { if(e.target === els.milestoneModalOverlay) closeMilestoneModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.btnAddMilestone.addEventListener('click', () => openMilestoneItemModal(null)); // マイルストーン新規追加モーダルを開く
  els.btnCancelMilestoneItemModal.addEventListener('click', closeMilestoneItemModal); // マイルストーン追加・編集のキャンセルボタン
  els.btnSaveMilestoneItemModal.addEventListener('click', saveMilestoneItem); // マイルストーン追加・編集の保存ボタン
  // els.milestoneItemModalOverlay.addEventListener('click', e => { if(e.target === els.milestoneItemModalOverlay) closeMilestoneItemModal(); }); // 外側クリックでは閉じないようにするため無効化した
  els.milestoneFilterMainTask.addEventListener('change', renderMilestoneList); // マイルストーンのメインタスク絞り込み変更時に再描画する
  els.milestoneFilterStatus.addEventListener('change', renderMilestoneList); // マイルストーンのステータス絞り込み変更時に再描画する
  els.milestoneSearchBox.addEventListener('input', renderMilestoneList); // マイルストーン検索入力時に再描画する

  // ファイル操作
  els.btnOpenFileModal.addEventListener('click', () => { closeAllModals(); els.fileModalOverlay.hidden = false; }); // 他モーダルを閉じてから開く
  els.btnCloseFileModal.addEventListener('click', () => els.fileModalOverlay.hidden = true); // 閉じるボタン
  // els.fileModalOverlay.addEventListener('click', e => { if(e.target === els.fileModalOverlay) els.fileModalOverlay.hidden = true; }); // 外側クリックでは閉じないようにするため無効化した
  els.btnConnectFile.addEventListener('click', connectFile); // ファイル接続ボタン
  els.btnReconnectFile.addEventListener('click', reconnectFile); // 再接続ボタン
  els.btnExportCsv.addEventListener('click', exportCSVManual); // 手動エクスポートボタン
  els.importCsvInput.addEventListener('change', e => { if(e.target.files[0]) importCSVFile(e.target.files[0]); }); // 手動インポート

  // ヘルプ
  els.btnOpenHelpModal.addEventListener('click', openHelpModal); // ヘルプボタン
  els.btnCloseHelpModal.addEventListener('click', closeHelpModal); // ヘルプ閉じるボタン
  els.helpModalOverlay.addEventListener('click', e => { if(e.target === els.helpModalOverlay) closeHelpModal(); }); // 背景クリックで閉じる

  // 表示切替・絞り込み（メインのリスト/ガント/業務余力表示用）
  els.tabList.addEventListener('click', () => switchView('list')); // リストタブ
  els.tabGantt.addEventListener('click', () => switchView('gantt')); // ガントタブ
  els.tabWorkload.addEventListener('click', () => switchView('workload')); // 業務余力タブ
  els.filterStatus.addEventListener('change', renderAll); // ステータス絞り込み変更
  els.sortKey.addEventListener('change', renderAll); // 並び替えキー変更
  els.searchBox.addEventListener('input', renderAll); // 検索文字列入力

  // ガント操作系
  document.querySelectorAll('.zoom-btn:not(.workload-zoom-btn)').forEach(btn => btn.addEventListener('click', () => setZoom(btn.dataset.zoom)));
  els.btnGanttPrev.addEventListener('click', () => shiftGanttView(-1));
  els.btnGanttNext.addEventListener('click', () => shiftGanttView(1));
  els.btnGanttToday.addEventListener('click', resetGanttToToday);
  els.btnGanttFit.addEventListener('click', fitGanttToTasks);
  els.chkCollapseAll.addEventListener('change', () => toggleCollapseAll(els.chkCollapseAll.checked));
  els.ganttScrollPane.addEventListener('scroll', () => { els.ganttLabelPane.scrollTop = els.ganttScrollPane.scrollTop; }); // グリッド側の縦スクロール量をラベル側にも反映し、行の高さがズレないようにする
  window.addEventListener('resize', syncGanttPaneScrollbarGap); // 追加：ウィンドウサイズが変わり横スクロールバーの有無・太さが変化した場合にも余白を再計算する

  // 業務余力ビュー操作系
  document.querySelectorAll('.workload-mode-btn').forEach(btn => btn.addEventListener('click', () => setWorkloadMode(btn.dataset.mode))); // タスク数ベース/工数ベースの切替ボタン群
  document.querySelectorAll('.workload-zoom-btn').forEach(btn => btn.addEventListener('click', () => setWorkloadZoom(btn.dataset.wzoom))); // 業務余力ビュー専用の週/月/四半期/年/すべてズームボタン群
  els.btnWorkloadPrev.addEventListener('click', () => shiftWorkloadView(-1)); // 前へボタン（1日単位で戻す）
  els.btnWorkloadNext.addEventListener('click', () => shiftWorkloadView(1)); // 次へボタン（1日単位で進める）
  els.btnWorkloadToday.addEventListener('click', resetWorkloadToday); // 今日に戻すボタン
  els.workloadThreshold.addEventListener('input', () => { const v = parseFloat(els.workloadThreshold.value); workloadThreshold = isNaN(v) ? 0 : v; persistWorkloadThreshold(); renderWorkloadChart(); }); // 閾値変更時はlocalStorageへ保存してからチャートだけ再描画する（一覧の絞り込みには影響しないため）
  els.workloadAxisMax.addEventListener('input', () => { const raw = els.workloadAxisMax.value.trim(); const v = parseFloat(raw); workloadAxisMax = (raw === '' || isNaN(v) || v <= 0) ? null : v; persistWorkloadAxisMax(); renderWorkloadChart(); }); // Y軸上限を変更するたびにlocalStorageへ保存し、チャートだけ再描画する（空欄または0以下の入力は「自動」扱いにする）
  els.btnClearWorkloadSelection.addEventListener('click', () => { selectedWorkloadDate = null; renderWorkloadSection(); }); // 選択解除ボタンで期間全体の一覧に戻す

  window.addEventListener('mousemove', e => { // マウス移動時にドラッグ中の見た目を更新する
    if(!dragState) return; // ドラッグ中でなければ何もしない
    if(dragState.kind === 'date') handleDateDragMove(e); // 日付ベースビューのドラッグ処理
    else if(dragState.kind === 'hour') handleHourDragMove(e); // 日(時間)ビューのドラッグ処理
  });
  window.addEventListener('mouseup', () => { // マウスを離した時にドラッグを確定する
    if(!dragState) return; // ドラッグ中でなければ何もしない
    if(dragState.kind === 'date') commitDateDrag(); // 日付ベースビューの変更を反映する
    else if(dragState.kind === 'hour') commitHourDrag(); // 日(時間)ビューの変更を反映する
    dragState = null; document.body.classList.remove('dragging-gantt'); hideDragTooltip(); // 状態解除・クラス除去・ツールチップ非表示
  });
  window.addEventListener('blur', () => { if(dragState) cancelDrag(); }); // ウィンドウがフォーカスを失った場合は安全側でキャンセルする

  document.addEventListener('keydown', e => { // キー入力の共通ハンドラ
    if(e.key === 'Escape'){ // Escapeキー押下時の処理
      if(dragState) cancelDrag(); // ドラッグ中ならキャンセルする
      closeItemModal(); // タスク追加・編集モーダルを閉じる
      closeFolderModal(); closeFolderItemModal(); // フォルダー管理・追加編集モーダルを閉じる
      closeMainTaskModal(); closeMainTaskItemModal(); // メインタスク管理・追加編集モーダルを閉じる
      closeSubTaskModal(); closeDetailTaskModal(); // サブタスク・ディテールタスク管理モーダルを閉じる
      closeMilestoneModal(); closeMilestoneItemModal(); // マイルストーン管理・追加編集モーダルを閉じる
      els.fileModalOverlay.hidden = true; closeHelpModal(); hideDescTooltip(); // ファイル操作・ヘルプモーダルも閉じ、備考ツールチップも隠す
      if(selectedWorkloadDate){ selectedWorkloadDate = null; if(currentView === 'workload') renderWorkloadSection(); } // 業務余力ビューで日付を選択中ならEscapeで選択解除する
    }
  });
}

// ===== アプリ起動時の初期化処理 =====
async function init(){ // アプリ起動時の初期化処理
  cacheEls(); bindEvents(); // DOM取得とイベント登録を行う
  const savedFolders = localStorage.getItem(LS_FOLDERS_KEY); // 保存済みフォルダーを取得する
  const savedMainTasks = localStorage.getItem(LS_MAINTASKS_KEY); // 保存済みメインタスクを取得する
  const savedSubTasks = localStorage.getItem(LS_SUBTASKS_KEY); // 保存済みサブタスクを取得する
  const savedDetailTasks = localStorage.getItem(LS_DETAILTASKS_KEY); // 保存済みディテールタスクを取得する
  const savedMilestones = localStorage.getItem(LS_MILESTONES_KEY); // 保存済みマイルストーンを取得する
  const savedThreshold = localStorage.getItem(LS_WORKLOAD_THRESHOLD_KEY); // 保存済みの業務余力閾値を取得する
  const savedAxisMax = localStorage.getItem(LS_WORKLOAD_AXISMAX_KEY); // 保存済みのY軸上限を取得する
  if(savedFolders) folders = JSON.parse(savedFolders).map(normalizeFolder); // フォルダーを復元する
  if(savedMainTasks) mainTasks = JSON.parse(savedMainTasks).map(normalizeMainTask); // メインタスクを復元する
  if(savedSubTasks) subTasks = JSON.parse(savedSubTasks).map(normalizeSubTask); // サブタスクを復元する
  if(savedDetailTasks) detailTasks = JSON.parse(savedDetailTasks).map(normalizeDetailTask); // ディテールタスクを復元する
  if(savedMilestones) milestones = JSON.parse(savedMilestones).map(normalizeMilestone); // マイルストーンを復元する
  if(savedThreshold !== null && !isNaN(parseFloat(savedThreshold))){ workloadThreshold = parseFloat(savedThreshold); } // 保存値が有効な数値であれば閾値の初期値として採用する
  if(savedAxisMax !== null && savedAxisMax !== '' && !isNaN(parseFloat(savedAxisMax)) && parseFloat(savedAxisMax) > 0){ workloadAxisMax = parseFloat(savedAxisMax); } // 保存値が有効な正の数値であればY軸上限の初期値として採用する（未保存/空欄/不正値なら自動のままにする）
  els.workloadThreshold.value = workloadThreshold; // 復元した閾値を入力欄の表示にも反映する
  els.workloadAxisMax.value = workloadAxisMax == null ? '' : workloadAxisMax; // 復元したY軸上限を入力欄の表示にも反映する（自動設定中は空欄のままにする）
  workloadViewStart = startOfDay(new Date()); // 業務余力ビューの初期表示開始日を今日にする
  ganttViewStart = startOfMonth(new Date()); // ここを変更：初回表示はタスクデータに合わせた全体表示(fitGanttToTasks)をやめ、常に「今月の1日」を先頭列にして開くようにする
  renderAll(); // 初期表示を描画する
  await tryRestoreHandle(); // 前回接続していたCSVファイルへの自動再接続を試みる
  ganttViewStart = startOfMonth(new Date()); // ここを変更：ファイル接続の復元によってタスクデータが後から読み込まれた場合でも、表示開始位置は「今月の1日」のまま変えないようにする
  renderGanttSection(); // ここを変更：全体表示に合わせるfitGanttToTasks()の呼び出しをやめ、表示開始位置は据え置いたままガントチャートだけを再描画する
}
document.addEventListener('DOMContentLoaded', init); // DOM構築完了後に初期化する
//----------------------------------------------------------------------------------------------------------------------------------------------------
//アプリ初期化・イベント登録用関数
//----------------------------------------------------------------------------------------------------------------------------------------------------
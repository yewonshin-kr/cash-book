/**
 * 가계부 웹앱 — 구글 시트 DB API (Google Apps Script)
 *
 * 설정 방법: README.md 참고
 * 1) 이 스크립트를 가계부용 스프레드시트에 연결된 Apps Script에 붙여넣기
 * 2) 아래 TOKEN 값을 아무도 모르는 긴 문자열로 변경
 * 3) 배포 > 새 배포 > 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한: 모든 사용자 (토큰으로 보호됨)
 * 4) 발급된 URL과 TOKEN을 프론트엔드 config.js에 입력
 */

const TOKEN = 'CHANGE_ME_TO_A_LONG_RANDOM_STRING';

/* 동기화 대상 시트(컬렉션) 목록 — 프론트 SYNC_COLS와 동일 */
const SHEETS = ['transactions','works','accounts','isa_items','savings','fixed','ry_month'];

function doGet(e){
  if(!checkToken(e)) return json({error:'unauthorized'});
  const action = e.parameter.action || 'bootstrap';
  if(action === 'bootstrap'){
    const data = {};
    SHEETS.forEach(name => data[name] = readSheet(name));
    return json(data);
  }
  return json({error:'unknown action'});
}

function doPost(e){
  let body;
  try{ body = JSON.parse(e.postData.contents); }
  catch(err){ return json({error:'bad json'}); }
  if(body.token !== TOKEN) return json({error:'unauthorized'});

  if(body.action === 'saveAll'){
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try{
      Object.keys(body.data || {}).forEach(name => {
        if(SHEETS.indexOf(name) >= 0) writeSheet(name, body.data[name]);
      });
    } finally { lock.releaseLock(); }
    return json({ok:true, savedAt:new Date().toISOString()});
  }
  return json({error:'unknown action'});
}

/* ---------- 시트 읽기: 1행 헤더 + 행 → 객체 배열 ---------- */
function readSheet(name){
  const sh = getSheet(name);
  const values = sh.getDataRange().getValues();
  if(values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const obj = {};
    headers.forEach((h,i) => {
      if(h === '') return;
      obj[h] = parseCell(r[i]);
    });
    return obj;
  });
}

/* ---------- 시트 쓰기: 객체 배열 → 헤더 + 행 (전체 덮어쓰기) ---------- */
function writeSheet(name, rows){
  const sh = getSheet(name);
  sh.clearContents();
  if(!rows || !rows.length) return;
  // 헤더 = 모든 객체 키의 합집합
  const headers = [];
  rows.forEach(r => Object.keys(r).forEach(k => { if(headers.indexOf(k)<0) headers.push(k); }));
  const out = [headers];
  rows.forEach(r => out.push(headers.map(h => encodeCell(r[h]))));
  sh.getRange(1,1,out.length,headers.length).setValues(out);
}

/* 배열/객체는 JSON 문자열로 저장, null은 빈 문자열 */
function encodeCell(v){
  if(v === null || v === undefined) return '';
  if(Array.isArray(v) || typeof v === 'object') return JSON.stringify(v);
  return v;
}
function parseCell(v){
  if(v === '') return null;
  if(typeof v === 'string' && (v.charAt(0)==='[' || v.charAt(0)==='{')){
    try{ return JSON.parse(v); }catch(e){ return v; }
  }
  return v;
}

function getSheet(name){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(name) || ss.insertSheet(name);
}
function checkToken(e){ return e && e.parameter && e.parameter.token === TOKEN; }
function json(obj){
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

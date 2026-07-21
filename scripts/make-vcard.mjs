#!/usr/bin/env node
// 명함에서 추출한 연락처 정보(JSON)를 vCard 3.0(.vcf) 파일로 변환한다.
// 사용법: node scripts/make-vcard.mjs <input.json> [output.vcf]
//
// 입력 JSON 형식 (name 외에는 모두 선택):
// {
//   "name": "홍길동",
//   "familyName": "홍",          // 생략 시 name에서 추정(한글: 첫 글자=성)
//   "givenName": "길동",
//   "org": "회사명",
//   "department": "부서명",
//   "title": "직함",
//   "phones": [{ "type": "cell|work|fax", "number": "010-1234-5678" }],
//   "emails": ["a@b.com"],
//   "address": "서울시 ...",
//   "url": "https://...",
//   "note": "메모"
// }

import { readFileSync, writeFileSync } from "node:fs";

// vCard 텍스트 값 이스케이프: 백슬래시, 세미콜론, 콤마, 줄바꿈
function esc(v) {
  return String(v)
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function splitName(c) {
  if (c.familyName || c.givenName) {
    return { family: c.familyName ?? "", given: c.givenName ?? "" };
  }
  const name = (c.name ?? "").trim();
  // 한글 이름(2~4자, 공백 없음)은 첫 글자를 성으로 추정
  if (/^[가-힣]{2,4}$/.test(name)) {
    return { family: name[0], given: name.slice(1) };
  }
  // 공백이 있으면 마지막 토큰을 성(서양식)으로 추정
  const parts = name.split(/\s+/);
  if (parts.length > 1) {
    return { family: parts[parts.length - 1], given: parts.slice(0, -1).join(" ") };
  }
  return { family: "", given: name };
}

const TEL_TYPES = { cell: "CELL", work: "WORK,VOICE", fax: "WORK,FAX", home: "HOME,VOICE" };

export function buildVCard(c) {
  if (!c.name || !String(c.name).trim()) {
    throw new Error("name 필드는 필수입니다.");
  }
  const { family, given } = splitName(c);
  const lines = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N;CHARSET=UTF-8:${esc(family)};${esc(given)};;;`,
    `FN;CHARSET=UTF-8:${esc(c.name)}`,
  ];
  if (c.org || c.department) {
    lines.push(`ORG;CHARSET=UTF-8:${esc(c.org ?? "")}${c.department ? ";" + esc(c.department) : ""}`);
  }
  if (c.title) lines.push(`TITLE;CHARSET=UTF-8:${esc(c.title)}`);
  for (const p of c.phones ?? []) {
    if (!p?.number) continue;
    const type = TEL_TYPES[p.type] ?? "CELL";
    lines.push(`TEL;TYPE=${type}:${esc(p.number)}`);
  }
  for (const e of c.emails ?? []) {
    if (e) lines.push(`EMAIL;TYPE=WORK:${esc(e)}`);
  }
  if (c.address) lines.push(`ADR;TYPE=WORK;CHARSET=UTF-8:;;${esc(c.address)};;;;`);
  if (c.url) lines.push(`URL:${esc(c.url)}`);
  if (c.note) lines.push(`NOTE;CHARSET=UTF-8:${esc(c.note)}`);
  lines.push("END:VCARD");
  return lines.join("\r\n") + "\r\n";
}

// CLI로 직접 실행된 경우
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split("/").pop())) {
  const [inputPath, outputPath] = process.argv.slice(2);
  if (!inputPath) {
    console.error("사용법: node scripts/make-vcard.mjs <input.json> [output.vcf]");
    process.exit(1);
  }
  const input = JSON.parse(readFileSync(inputPath, "utf8"));
  const contacts = Array.isArray(input) ? input : [input];
  const vcf = contacts.map(buildVCard).join("");
  const out = outputPath ?? inputPath.replace(/\.json$/, "") + ".vcf";
  writeFileSync(out, vcf, "utf8");
  console.log(out);
}

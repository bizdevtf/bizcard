# bizcard — 명함 → 연락처 자동 저장

명함 사진을 찍어 Claude 채팅으로 보내면, Claude가 명함 내용을 인식해
vCard(.vcf) 파일로 만들어 보내주는 프로젝트입니다.
휴대폰에서 받은 .vcf 파일을 열면 한 번의 탭으로 연락처에 저장됩니다.
(안드로이드/아이폰 모두 지원)

## 사용 방법

1. 휴대폰으로 명함 사진 촬영
2. 이 저장소가 연결된 Claude 세션에 사진 전송 (여러 장도 가능)
3. Claude가 이름·회사·직함·전화·이메일 등을 추출해 `.vcf` 파일로 회신
4. 휴대폰에서 파일을 열어 "연락처에 저장" 탭

## 구성

- `.claude/skills/bizcard/SKILL.md` — 명함 사진 수신 시 Claude의 처리 규칙
  (추출 항목, 한글/영문 병기 처리, 전화번호 정규화, 개인정보 취급 등)
- `scripts/make-vcard.mjs` — 추출된 연락처 JSON을 vCard 3.0(.vcf)으로 변환하는
  Node 스크립트. 의존성 없음(Node 내장 모듈만 사용).

```bash
# 스크립트 단독 사용 예
node scripts/make-vcard.mjs contact.json contact.vcf
```

입력 JSON 형식은 `scripts/make-vcard.mjs` 상단 주석 참조.
JSON 배열을 넘기면 여러 명함을 하나의 .vcf로 만든다.

## 주의

- 명함에서 추출한 개인정보(JSON/vcf)는 저장소에 커밋하지 않는다.

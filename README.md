# Code Analyzer

코드 분석 CLI 도구 - JavaScript/TypeScript 프로젝트의 언어 사용률, 중복 코드, 사용되지 않는 export를 분석합니다.

## Tech Stack
- TypeScript
- Node.js CLI
- SWC (Fast JavaScript/TypeScript parser)
- Commander.js (CLI framework)

## Features

1. **언어 통계 분석**: 프로젝트에 사용된 언어(JS, TS, JSX, TSX) 목록과 비율
2. **중복 코드 탐지**: 프로젝트 내 중복된 코드 블록과 위치 추적
3. **사용되지 않는 코드 탐지**: export는 되지만 import되지 않는 코드 검출
4. **리포트 생성**: JSON 또는 HTML 형식으로 분석 결과 출력

## Installation

```bash
npm install
npm run build
```

## Usage

### 기본 사용법

```bash
node dist/index.js "src/**/*.{js,ts,jsx,tsx}"
```

### 옵션

```bash
node dist/index.js [patterns...] [options]

Arguments:
  patterns                 분석할 파일 패턴 (예: "src/**/*.{js,ts,jsx,tsx}")

Options:
  -o, --output <path>     출력 파일 경로 (기본값: ./report)
  -f, --format <type>     리포트 형식: json 또는 html (기본값: html)
  -h, --help              도움말 표시
  -V, --version           버전 표시
```

### 예제

#### HTML 리포트 생성
```bash
node dist/index.js "src/**/*.ts" -f html -o ./analysis-report
```

#### JSON 리포트 생성
```bash
node dist/index.js "**/*.{js,jsx}" -f json -o ./report
```

## 프로젝트 구조

```
src/
├── index.ts                    # CLI 진입점
├── types/                      # 타입 정의
│   └── index.ts
├── traverser/                  # 파일 순회 모듈
│   └── index.ts
├── parser/                     # AST 파싱 모듈
│   └── index.ts
├── analyzer/                   # 언어 통계 분석
│   └── index.ts
├── detector/                   # 코드 탐지 모듈
│   ├── duplicate/             # 중복 코드 탐지
│   │   └── index.ts
│   └── unused/                # 사용되지 않는 코드 탐지
│       └── index.ts
├── reporter/                   # 리포트 생성
│   ├── index.ts
│   ├── json-reporter.ts
│   └── html-reporter.ts
└── utils/                      # 유틸리티 함수
    └── ast-utils.ts
```

## 동작 원리

1. **파일 순회**: glob 패턴으로 분석 대상 파일 수집
2. **파싱**: SWC를 사용해 각 파일을 AST로 파싱
3. **분석**: AST를 순회하며 다음 항목 분석
   - 언어별 파일 수와 비율
   - 중복 코드 블록 (정규화된 코드 비교)
   - export된 코드 중 import되지 않는 항목
4. **리포트 생성**: JSON 또는 HTML 형식으로 결과 출력

## Output Examples

### Console Output
```
Starting code analysis...

Scanning files matching patterns: src/**/*.ts
Found 15 files

Parsing files...
Parsing completed

Analyzing languages...
Language analysis completed
  - typescript: 15 files (100.0%)

Detecting duplicate code...
Found 2 duplicate code blocks

Detecting unused exports...
Found 3 unused exports

HTML report generated: ./report.html

Analysis completed successfully!
```

## License

ISC

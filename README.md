<p align="center">
  <img src="brown.png" alt="Sample Image">
</p>

# 내이름은코난탐정2조의 [웹 서버] 트렐로 프로젝트 ![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Trello/trello1.svg)

## 프로젝트 소개

칸반보드 기반 Trello같은 프로젝트 협업 도구 서비스

## 팀소개

팀장 : 🕵️여창준<br>
팀원 : 🕵🏻조영진<br>
팀원 : 🕵🏼‍♀️김현민<br>
팀원 : 🕵🏼‍♀️이현우<br>
팀원 : ☕김진서<br>
팀원 : 🕵🏿‍♂️조규민

## 배포된 주소/API 명세서 (SWAGGER)


[배포된링크](https://ginger-sparta.duckdns.org/) <br>
[SWAGGER](https://ginger-sparta.duckdns.org/api)


## 주요 기능

### Auth (인증)

- 회원가입
- 로그인 / 로그아웃
- 토큰 재발급
- 이메일 인증번호 발송 / 검증

### User (사용자)

- 프로필 조회 / 수정
- 비밀번호 수정
- 프로필 이미지 수정 (multer-s3 사용)

### Board (보드)

- 보드 생성 / 목록 조회 / 상세 조회 / 수정 / 삭제
- 보드 멤버 초대 / 수락

### List (리스트)

- 리스트 생성 / 수정 / 삭제
  (목록 조회 / 상세 조회는 보드 상세 조회에 포함)
- 리스트 위치 이동

### Card (카드)

- 카드 생성 / 상세 조회 / 수정 / 삭제
- 카드 위치 이동

  #### Assignee (작업 담당자)
  - 카드 담당자 추가 / 삭제

  #### Checklist (체크리스트)
  - 카드 체크리스트 추가 / 수정 / 삭제
    (목록 조회는 카드 상세 조회에 포함)
  - 카드 체크리스트 체크 / 언체크

  #### Comment (댓글)
  - 댓글 생성 / 수정 / 삭제
    (목록 조회는 카드 상세 조회에 포함)

  #### Attachment (첨부파일)
  - 카드 첨부 파일 업로드 / 다운로드
  - 카드 첨부 파일 삭제
    (목록 조회는 카드 상세 조회에 포함)

## 와이어 프레임

![alt text](yframe.png)

## ERD

![alt text](ERD.png)

## 기능 도식화

### 핵심 기능
<img width="720" alt="image" src="https://github.com/user-attachments/assets/c9328745-f6b5-48a6-8547-db673624ff7e">

### 부가 기능
<img width="720" alt="image" src="https://github.com/user-attachments/assets/a821096d-ce6b-4117-922b-c3c17901350b">

#### 핵심 기능 - 보드 초대
<img width="720" alt="image" src="https://github.com/user-attachments/assets/a830171c-f2c0-403e-bb16-39cbcc96d6e0">
<img width="720" alt="image" src="https://github.com/user-attachments/assets/720a7384-a6cc-44c8-9730-e5f2a375e343">
<img width="720" alt="image" src="https://github.com/user-attachments/assets/63237f71-0af6-4218-bf5e-9365ebe2296f">

#### 부가 기능 - 파일 첨부
<img width="720" alt="image" src="https://github.com/user-attachments/assets/76c75bb2-a4ac-4145-b21a-f64655a79e87">

#### 핵심 기능 - 카드 생성
<img width="720" alt="image" src="https://github.com/user-attachments/assets/c1e919a6-7dbc-45ac-ba7e-3674c067ea92">

#### 핵심 기능 - 카드 이동
<img width="720" alt="image" src="https://github.com/user-attachments/assets/2e7704f4-df50-43d3-b92e-6c43e89f5c12">



## 기술 스택

### Programming Languages & Frameworks

![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/NodeJS/nodejs1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/npm/npm1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/NestJS/nestjs1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/TypeORM/typeorm1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/TypeScript/typescript1.svg)

### Editor & Tester

![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Git/git1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Github/github1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Jest/jest1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/VisualStudioCode/visualstudiocode1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Webstorm/webstorm1.svg)
<img src="https://img.shields.io/badge/Insomnia-5849BE?style=flat-square&logo=insomnia&logoColor=white" width="120"/>

### Infrastructure / Add-On / Database

![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Ubuntu/ubuntu1.svg)
![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/MySQL/mysql1.svg)
<img src="https://img.shields.io/badge/Amazon%20S3-232F3E?style=flat-square&logo=amazonaws&logoColor=white" width="110"/>
<img src="https://img.shields.io/badge/Redis-DC382D?style=flat-square&logo=redis&logoColor=white" width="87"/>

### Communication

![alt text](https://ziadoua.github.io/m3-Markdown-Badges/badges/Notion/notion1.svg)
<img src="https://img.shields.io/badge/Slack-4A154B?style=flat-square&logo=slack&logoColor=white" width="86"/>

## 패키지 설치

```bash
$ npm install
```

## 실행 방법

```bash
# 서버 실행(배포용)
$ npm run start

# 서버 실행(개발용)
$ npm run start:dev
```

## 테스트

```bash
# 테스트 실행
$ npm run test

# 테스트 커버리지 확인
$ npm run test:cov
```

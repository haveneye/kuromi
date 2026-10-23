# 부모 휴대폰 푸시 알림 설정

현재 앱 메시지는 Firestore에 저장되지만, 알림 서버는 별도 배포가 필요합니다. 이 폴더의 firebase-messaging-sw.js와 functions/가 푸시 수신·발송 코드입니다.

## 1. HTTPS 웹 주소 확인

앱은 HTTPS 주소에서 열어야 합니다. 현재 설정 기본 주소는 https://haveneye.github.io/kuromi/ 입니다. 실제 앱 주소가 다르면 아래 Firestore 설정의 appUrl을 실제 주소로 바꾸세요.

## 2. Firebase에서 공개 VAPID 키 만들기

Firebase Console의 kuromi-app 프로젝트에서 프로젝트 설정 → Cloud Messaging → 웹 푸시 인증서 → 키 쌍 생성을 누릅니다. 공개 키를 복사합니다. 이 키는 공개 키이며 비공개 키는 앱에 넣지 않습니다.

Firestore의 artifacts/kuromi-study-default/public/data/config/pushSettings 문서를 만들고 다음 필드를 저장합니다.

- vapidKey: 복사한 공개 키
- appUrl: https://haveneye.github.io/kuromi/ (실제 앱 주소)

## 3. 발송 서버 배포

이 프로젝트의 루트에서 Firebase CLI에 로그인한 뒤 firebase deploy --only functions를 실행하면 notifyParentsOfChildMessage가 배포됩니다. Cloud Functions 배포에는 Firebase 프로젝트의 Blaze 요금제가 필요합니다. 요금제 전환과 배포는 사용자가 비용 조건을 확인한 뒤 진행해야 합니다. 배포가 성공하면 pushSettings 문서에 serverReady: true를 추가하세요.

## 4. 부모 휴대폰 등록

두 부모 휴대폰에서 HTTPS 앱에 접속하고, 부모님 메뉴에 PIN으로 들어간 뒤 아이별 할 일 영역의 알림 켜기를 누릅니다. 알림 권한을 허용하면 해당 휴대폰이 같은 부모 수신 그룹에 등록됩니다. 아이가 메시지를 보내면 등록된 모든 부모 휴대폰이 알림을 받으며, 알림을 누르면 부모 PIN 확인 뒤 해당 아이 메시지함으로 이동합니다.

아이폰은 iOS 16.4 이상에서 앱을 홈 화면에 추가한 뒤 실행해야 웹 푸시를 받을 수 있습니다.
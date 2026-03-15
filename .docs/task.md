### 회원 지역 정보 (Region1, Region2) — 기존 API 필드 추가
```
별도 엔드포인트 없이 기존 회원 등록/수정 API에서 처리됩니다.

필드	타입	설명
Region1	varchar(45)	지역1 (시/도)
Region2	varchar(45)	지역2 (구/군)
등록 POST /member


{
  "id": "user01",
  "password": "1234",
  "Region1": "서울특별시",
  "Region2": "강남구"
}
수정 PUT /member/:idx


{
  "Region1": "경기도",
  "Region2": "성남시"
}
```
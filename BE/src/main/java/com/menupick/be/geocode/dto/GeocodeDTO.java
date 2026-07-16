package com.menupick.be.geocode.dto;

public class GeocodeDTO {

    /** 지오코딩 결과 한 건: 검색어를 좌표로 변환한 값. */
    public record GeocodeResult(double lat, double lng, String label, String address) {
    }
}

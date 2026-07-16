package com.menupick.be.geocode.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.geocode.dto.GeocodeDTO.GeocodeResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * 장소/주소 → 좌표 (카카오 로컬 API 서버 프록시).
 * 데스크톱은 GPS가 없어 지오코딩이 위치 지정의 주 수단이 된다.
 * REST 키를 서버에만 두고 프론트에는 좌표만 내려준다.
 */
@Service
public class GeocodeService {

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final String restApiKey;

    public GeocodeService(@Value("${menupick.kakao.rest-api-key}") String restApiKey) {
        this.restApiKey = restApiKey;
    }

    public GeocodeResult geocode(String query) {
        // 1차: 키워드(장소) 검색 — "신당역", "동대문역사문화공원" 같은 장소명
        JsonNode doc = firstDocument("https://dapi.kakao.com/v2/local/search/keyword.json", query);
        if (doc == null) {
            // 2차: 주소 검색 — "서울 중구 퇴계로 431" 같은 주소 입력
            doc = firstDocument("https://dapi.kakao.com/v2/local/search/address.json", query);
        }
        if (doc == null) {
            throw new ApiException(ErrorCode.GEOCODE_NO_RESULT);
        }

        double lng = doc.path("x").asDouble();
        double lat = doc.path("y").asDouble();
        String label = doc.hasNonNull("place_name")
                ? doc.path("place_name").asText()
                : doc.path("address_name").asText();
        String address = doc.hasNonNull("road_address_name") && !doc.path("road_address_name").asText().isBlank()
                ? doc.path("road_address_name").asText()
                : doc.path("address_name").asText();
        return new GeocodeResult(lat, lng, label, address);
    }

    private JsonNode firstDocument(String endpoint, String query) {
        try {
            String url = endpoint + "?size=1&query=" + URLEncoder.encode(query, StandardCharsets.UTF_8);
            HttpRequest request = HttpRequest.newBuilder(URI.create(url))
                    .header("Authorization", "KakaoAK " + restApiKey)
                    .timeout(Duration.ofSeconds(5))
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new ApiException(ErrorCode.GEOCODE_FAILED);
            }
            JsonNode documents = objectMapper.readTree(response.body()).path("documents");
            return documents.isArray() && documents.size() > 0 ? documents.get(0) : null;
        } catch (IOException e) {
            throw new ApiException(ErrorCode.GEOCODE_FAILED);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new ApiException(ErrorCode.GEOCODE_FAILED);
        }
    }
}

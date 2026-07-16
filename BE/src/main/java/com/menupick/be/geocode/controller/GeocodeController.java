package com.menupick.be.geocode.controller;

import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.geocode.dto.GeocodeDTO.GeocodeResult;
import com.menupick.be.geocode.service.GeocodeService;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** 장소/주소 → 좌표. 카카오 REST 키는 서버에만 두고 프론트에는 좌표만 내려준다. */
@RestController
@RequestMapping("/geocode")
@RequiredArgsConstructor
@Validated
public class GeocodeController {

    private final GeocodeService geocodeService;

    @GetMapping
    public ResponseEntity<ApiResponse<GeocodeResult>> geocode(@RequestParam @Size(max = 200) String query) {
        GeocodeResult response = geocodeService.geocode(query);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "지오코딩에 성공했습니다.", response));
    }
}

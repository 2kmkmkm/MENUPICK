package com.menupick.be.point.controller;

import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.point.dto.PointDTO;
import com.menupick.be.point.dto.PointDTO.PointListResponse;
import com.menupick.be.point.dto.PointDTO.PointResponse;
import com.menupick.be.point.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/point")
@RequiredArgsConstructor
public class PointController {
    private final PointService pointService;

    @GetMapping("/list")
    public ResponseEntity<ApiResponse<List<PointListResponse>>> list(@AuthenticationPrincipal UserDetails userDetails) {
        List<PointListResponse> response = pointService.list(userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "포인트 적립 내역 불러오기에 성공했습니다.", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<PointResponse>> point(@AuthenticationPrincipal UserDetails userDetails) {
        PointResponse response = pointService.point(userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "적립된 포인트 불러오기에 성공했습니다.", response));
    }
}

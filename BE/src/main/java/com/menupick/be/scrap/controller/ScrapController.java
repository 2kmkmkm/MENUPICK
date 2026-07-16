package com.menupick.be.scrap.controller;

import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.scrap.dto.ScrapDTO.ReviewInfo;
import com.menupick.be.scrap.dto.ScrapDTO.ScrapInfo;
import com.menupick.be.scrap.dto.ScrapDTO.ScrapListResponse;
import com.menupick.be.scrap.dto.ScrapDTO.ScrapValue;
import com.menupick.be.scrap.service.ScrapService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/scraps")
@RequiredArgsConstructor
public class ScrapController {
    private final ScrapService scrapService;

    // 스크랩 토글
    @PostMapping("/{restaurantId}")
    public ResponseEntity<ApiResponse<ScrapValue>> toggle(@PathVariable Long restaurantId, @AuthenticationPrincipal UserDetails userDetails) {
        ScrapValue response = scrapService.toggle(userDetails.getUsername(), restaurantId);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(201, "스크랩 등록/삭제 성공했습니다.", response));
    }

    // 스크랩한 맛집 전체 조회
    @GetMapping
    public ResponseEntity<ApiResponse<ScrapListResponse>> list(@AuthenticationPrincipal UserDetails userDetails) {
        ScrapListResponse response = scrapService.list(userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "스크랩한 맛집 불러오기에 성공했습니다.", response));
    }

    @PutMapping("/review/{restaurantId}")
    public ResponseEntity<ApiResponse<ScrapInfo>> updateReview(@PathVariable Long restaurantId, @RequestBody ReviewInfo request, @AuthenticationPrincipal UserDetails userDetails) {
        ScrapInfo response = scrapService.updateReview(userDetails.getUsername(), request, restaurantId);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "리뷰/평점이 수정되었습니다.", response));
    }
}

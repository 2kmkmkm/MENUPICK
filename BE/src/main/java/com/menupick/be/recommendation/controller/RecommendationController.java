package com.menupick.be.recommendation.controller;

import com.menupick.be.ai.RecoResult;
import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.recommendation.dto.RecommendationDTO;
import com.menupick.be.recommendation.dto.RecommendationDTO.HistoryResponse;
import com.menupick.be.recommendation.dto.RecommendationDTO.SearchRequest;
import com.menupick.be.recommendation.dto.RecommendationDTO.SearchResponse;
import com.menupick.be.recommendation.service.RecommendationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class RecommendationController {
    private final RecommendationService recommendationService;

    // 1. 맛집 추천 요청 생성 (AI 추천받기)
    @PostMapping("/recommendations")
    public ResponseEntity<ApiResponse<SearchResponse>> search(@AuthenticationPrincipal UserDetails userDetails, @Valid @RequestBody SearchRequest request) {
        SearchResponse response = recommendationService.search(userDetails.getUsername(), request);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "맛집 불러오기에 성공했습니다.", response));
    }

    // 2. 검색 히스토리 조회
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<HistoryResponse>>> history(@AuthenticationPrincipal
                                                                                             UserDetails userDetails) {
        List<HistoryResponse> historyList = recommendationService.history(userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "검색 내역 불러오기 성공", historyList));
    }

}

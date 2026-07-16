package com.menupick.be.recommendation.controller;

import com.menupick.be.ai.RecoResult;
import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.recommendation.dto.RecommendationDTO;
import com.menupick.be.recommendation.dto.RecommendationDTO.HistoryResponse;
import com.menupick.be.recommendation.dto.RecommendationDTO.SearchRequest;
import com.menupick.be.recommendation.dto.RecommendationDTO.SearchResponse;
import com.menupick.be.recommendation.service.RecommendationService;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
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
    private final UserRepository userRepository;

    // 1. 맛집 추천 요청 생성 (AI 추천받기)
    @PostMapping("/recommendations")
    public ResponseEntity<ApiResponse<SearchResponse>> search(@AuthenticationPrincipal UserDetails userDetails, @Valid @RequestBody SearchRequest request) {
        SearchResponse response = recommendationService.search(userDetails.getUsername(), request);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "맛집 불러오기에 성공했습니다.", response));
    }

    // 2. 지난 추천 단건 조회 (내 기록 상세 다시 보기)
    @GetMapping("/recommendations/{recId}")
    public ResponseEntity<ApiResponse<SearchResponse>> view(@PathVariable Long recId,
                                                            @AuthenticationPrincipal UserDetails userDetails) {
        User user = userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));
        SearchResponse response = recommendationService.getForUser(user.getId(), recId);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "지난 추천 불러오기에 성공했습니다.", response));
    }

    // 3. 검색 히스토리 조회
    @GetMapping("/history")
    public ResponseEntity<ApiResponse<List<HistoryResponse>>> history(@AuthenticationPrincipal
                                                                                             UserDetails userDetails) {
        List<HistoryResponse> historyList = recommendationService.history(userDetails.getUsername());

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "검색 내역 불러오기 성공", historyList));
    }

}

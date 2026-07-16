package com.menupick.be.contribution.controller;

import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.contribution.dto.ContributionDTO.ContributeRequest;
import com.menupick.be.contribution.dto.ContributionDTO.ContributionResponse;
import com.menupick.be.contribution.dto.ContributionDTO.ReviewContributeRequest;
import com.menupick.be.contribution.service.ContributionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/contributions")
@RequiredArgsConstructor
public class ContributionController {

    private final ContributionService contributionService;

    // 신규 매장 제보 (카카오 검증 링크 있으면 +5P, 직접 입력은 +0P)
    @PostMapping
    public ResponseEntity<ApiResponse<ContributionResponse>> contribute(@Valid @RequestBody ContributeRequest request,
                                                                        @AuthenticationPrincipal UserDetails userDetails) {
        ContributionResponse response = contributionService.contribute(userDetails.getUsername(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(201, "매장 제보가 등록되었습니다.", response));
    }

    // 등록된 가게에 리뷰(메뉴 신호) 제보 (+1P, 가게당 1회)
    @PostMapping("/review")
    public ResponseEntity<ApiResponse<ContributionResponse>> review(@Valid @RequestBody ReviewContributeRequest request,
                                                                    @AuthenticationPrincipal UserDetails userDetails) {
        ContributionResponse response = contributionService.review(userDetails.getUsername(), request);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(201, "리뷰 제보가 등록되었습니다.", response));
    }
}

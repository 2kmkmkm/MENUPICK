package com.menupick.be.share.controller;

import com.menupick.be.common.dto.ApiResponse;
import com.menupick.be.share.dto.ShareDTO.ShareInfo;
import com.menupick.be.share.dto.ShareDTO.SharedView;
import com.menupick.be.share.dto.ShareDTO.VoteRequest;
import com.menupick.be.share.service.ShareService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

/**
 * 추천 공유 + 익명 투표.
 * 생성·마감은 인증 필요, /shared/** 조회·투표는 비로그인 공개(SecurityConfig permitAll).
 */
@RestController
@RequiredArgsConstructor
public class ShareController {

    private final ShareService shareService;

    // 공유 링크 생성 (기존 링크 있으면 재사용)
    @PostMapping("/recommendations/{id}/share")
    public ResponseEntity<ApiResponse<ShareInfo>> create(@PathVariable Long id,
                                                         @AuthenticationPrincipal UserDetails userDetails) {
        ShareInfo response = shareService.create(userDetails.getUsername(), id);

        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(201, "공유 링크가 생성되었습니다.", response));
    }

    // 투표 마감 (공유 생성자만)
    @PostMapping("/recommendations/{id}/share/close")
    public ResponseEntity<ApiResponse<ShareInfo>> close(@PathVariable Long id,
                                                        @AuthenticationPrincipal UserDetails userDetails) {
        ShareInfo response = shareService.close(userDetails.getUsername(), id);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "투표가 마감되었습니다.", response));
    }

    // 공유 페이지 조회 (비로그인 허용)
    @GetMapping("/shared/{token}")
    public ResponseEntity<ApiResponse<SharedView>> view(@PathVariable String token,
                                                        @RequestParam(required = false) String voter) {
        SharedView response = shareService.view(token, voter);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "공유 페이지 조회에 성공했습니다.", response));
    }

    // 익명 투표 (비로그인 허용, 같은 voterKey 재투표 = 선택 변경)
    @PostMapping("/shared/{token}/votes")
    public ResponseEntity<ApiResponse<SharedView>> vote(@PathVariable String token,
                                                        @Valid @RequestBody VoteRequest request) {
        SharedView response = shareService.vote(token, request);

        return ResponseEntity.status(HttpStatus.OK).body(ApiResponse.success(200, "투표가 반영되었습니다.", response));
    }
}

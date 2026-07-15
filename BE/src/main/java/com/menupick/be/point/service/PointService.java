package com.menupick.be.point.service;

import com.menupick.be.common.exception.ApiException;
import com.menupick.be.common.exception.ErrorCode;
import com.menupick.be.point.dto.PointDTO;
import com.menupick.be.point.dto.PointDTO.PointListResponse;
import com.menupick.be.point.dto.PointDTO.PointResponse;
import com.menupick.be.point.entity.Point;
import com.menupick.be.point.entity.PointType;
import com.menupick.be.point.repository.PointRepository;
import com.menupick.be.user.entity.User;
import com.menupick.be.user.repository.UserRepository;
import com.menupick.be.user.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointService {
    private final UserRepository userRepository;
    private final PointRepository pointRepository;

    // 포인트 적립 내역 조회
    public List<PointListResponse> list(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        List<Point> points = pointRepository.findAllByUserIdOrderByCreatedAtDesc(user.getId());

        return points.stream()
                .map(p -> PointListResponse.builder()
                        .pointId(p.getId())
                        .reason(p.getReason())
                        .delta(p.getDelta())
                        .createdAt(p.getCreatedAt())
                        .build())
                .toList();
    }

    // 누적 포인트 조회
    public PointResponse point(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(ErrorCode.USER_NOT_FOUND));

        Integer sum = pointRepository.sumDeltaByUserId(user.getId());

        int totalPoint = (sum != null) ? sum : 0;

        return PointResponse.builder()
                .point(totalPoint)
                .build();
    }

    // 포인트 적립/차감
    @Transactional
    public void savePointTx(User user, PointType type) {
        Point pointTx = Point.builder()
                .user(user)
                .delta(type.getDelta())
                .reason(type.getDefaultReason())
                .build();
        pointRepository.save(pointTx);
    }

}

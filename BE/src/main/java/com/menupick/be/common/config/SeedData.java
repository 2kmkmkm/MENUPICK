package com.menupick.be.common.config;


import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.Restaurant.repository.RestaurantRepository;
import com.menupick.be.RestaurantMenuSignal.entity.RestaurantMenuSignal;
import com.menupick.be.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * 식당 데이터는 코드에 하드코딩하지 않고 resources/seed/*.tsv 에서 읽는다. 이 TSV 는 네이버 플레이스
 * 실측 크롤 결과(poc/*.csv)를 poc/build_seed_tsv.py 로 변환한 것이라, 좌표를 지어낼 여지가 없다.
 * 데이터를 늘리려면 크롤러를 다시 돌리고 build_seed_tsv.py 만 재실행하면 된다.
 */
@Component
@RequiredArgsConstructor
public class SeedData implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RestaurantRepository restaurantRepository;
    private final PasswordEncoder passwordEncoder;

    // 1. 애플리케이션 실행 시 초기 데이터 세팅
    @Override
    @Transactional
    public void run(String... args) {
        seedRestaurants();
    }

    private void seedRestaurants() {
        System.out.print(">>>> seedRestaurant 실행");

        if (restaurantRepository.count() > 0) {
            System.out.println("이미 DB에 데이터가 존재하여 시딩을 건너뜁니다.");
            System.out.println("count: " + restaurantRepository.count());

            return;
        }

        Map<String, Restaurant> byPlaceId = new HashMap<>();
        List<Restaurant> ordered = new ArrayList<>();

        List<String[]> restaurantRows = readTsv("seed/restaurants.tsv");

        System.out.println("restaurants.tsv 로드 완료");
        System.out.println("count: " + restaurantRows.size());

        for (String[] c : readTsv("seed/restaurants.tsv")) {
            if (c.length < 5) {
                continue;
            }

            double lat = Double.parseDouble(c[3]);
            double lng = Double.parseDouble(c[4]);

            String roadAddr = c.length > 5 ? c[5] : ""; // 네이버 크롤 도로명주소를 그대로 사용(지역 하드코딩 금지)
            Restaurant restaurant = new Restaurant(c[1], c[2], roadAddr, lat, lng);

            if (c.length > 7 && "Y".equals(c[7])) {
                restaurant.setGroupOk(true); // 공공데이터 병합 시 추가된 '단체 이용 가능' 플래그
            }

            byPlaceId.put(c[0], restaurant);
            ordered.add(restaurant);
        }

        for (String[] c : readTsv("seed/signals.tsv")) {
            if (c.length < 3) {
                continue;
            }

            Restaurant restaurant = byPlaceId.get(c[0]);

            if (restaurant == null) {
                continue;
            }

            int count = Integer.parseInt(c[2]);
            String snippet = "리뷰에서 '" + c[1] + "' 언급이 " + count + "회 확인됐어요";
            restaurant.addSignal(new RestaurantMenuSignal(c[1], count, snippet));
        }

        restaurantRepository.saveAll(ordered);
    }

    /** classpath TSV 한 줄 = 탭 구분 필드 배열. 필드에는 탭이 없으므로 split("\t") 로 충분하다. */
    private List<String[]> readTsv(String path) {
        List<String[]> rows = new ArrayList<>();
        ClassPathResource resource = new ClassPathResource(path);
        if (!resource.exists()) {
            return rows;
        }
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = reader.readLine()) != null) {
                if (!line.isBlank()) {
                    rows.add(line.split("\t", -1));
                }
            }
        } catch (IOException e) {
            throw new IllegalStateException("시드 파일을 읽지 못했습니다: " + path, e);
        }
        return rows;
    }
}


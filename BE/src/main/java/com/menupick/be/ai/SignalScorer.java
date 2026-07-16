package com.menupick.be.ai;

import com.menupick.be.Restaurant.entity.Restaurant;
import com.menupick.be.RestaurantMenuSignal.entity.RestaurantMenuSignal;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Deterministic menu-signal scoring shared by the AI implementations.
 *
 * <p>여러 메뉴 요청은 두 단계로 뽑는다.
 * <ol>
 *   <li><b>커버리지 우선</b> — 요청한 메뉴 <em>전부</em>에 유의미한 후기가 있는 집을 먼저.
 *       짜장+짬뽕처럼 한 집이 다 하는 조합에서 "둘 다 되는 집"이 상위에 온다.
 *       정렬은 가장 약한 메뉴의 후기 수 기준(min) — 짜장 500·짬뽕 3인 사실상 짜장집이
 *       짜장 100·짬뽕 80인 진짜 겸업집을 이기지 못하게.</li>
 *   <li><b>라운드로빈</b> — 남은 자리는 메뉴별 r등을 번갈아 채워 다양성 보장.
 *       치킨+마라탕처럼 교집합이 없는 조합은 커버 집이 없어 자연히 이 단계만 돈다.</li>
 * </ol>
 * 단일 메뉴는 그 메뉴의 1·2·3등으로 수렴한다.
 */
public final class SignalScorer {

    private static final int MAX_RECOMMENDATIONS = 3;
    private static final int MAX_ON_HOLD = 6; // 보류는 근소 탈락자 몇 곳만 — 무관한 식당 전체를 나열하지 않는다
    private static final int MIN_FULL_COVER_MENTIONS = 3; // 커버 인정 최소 후기 수 — 1~2건 우연 언급은 잡음으로 본다

    private SignalScorer() {
    }

    public static RecoResult score(List<String> menus, List<Restaurant> candidates) {
        List<String> queried = menus.stream()
                .filter(m -> m != null && !normalize(m).isEmpty())
                .map(String::trim)
                .distinct()
                .toList();

        if (queried.isEmpty()) {
            return new RecoResult(List.of(), List.of());
        }

        boolean multi = queried.size() > 1;

        // 후보별 메뉴 신호 집계(하나 이상의 메뉴에 신호가 있는 곳만).
        List<Scored> scored = new ArrayList<>();
        for (Restaurant restaurant : candidates) {
            Scored s = scoreOne(restaurant, queried);
            if (s.coverage() > 0) {
                scored.add(s);
            }
        }

        // 메뉴별 랭킹: 그 메뉴 언급수 내림차순(신호 있는 곳만).
        Map<String, List<Scored>> byMenu = new LinkedHashMap<>();
        for (String menu : queried) {
            List<Scored> ranked = scored.stream()
                    .filter(s -> s.count(menu) > 0)
                    .sorted(Comparator.comparingInt((Scored s) -> s.count(menu)).reversed())
                    .toList();
            byMenu.put(menu, ranked);
        }

        int need = MAX_RECOMMENDATIONS + MAX_ON_HOLD;
        List<Pick> picks = new ArrayList<>();
        Set<Long> seen = new HashSet<>();

        // 1단계 — 커버리지 우선: 요청 메뉴 전부에 후기가 충분한 집을 '가장 약한 메뉴' 기준으로 정렬해 먼저 뽑는다.
        // 게이트는 크롤 실측 신호만 인정 — 사용자 제보 신호를 세면 반복 제보로 1단계(=상위 노출)를 하이재킹할 수 있다.
        if (multi) {
            List<Scored> fullCoverage = scored.stream()
                    .filter(s -> queried.stream().allMatch(m -> s.crawledCount(m) >= MIN_FULL_COVER_MENTIONS))
                    .sorted(Comparator.comparingInt(Scored::minCount).reversed()
                            .thenComparing(Comparator.comparingInt(Scored::totalCount).reversed()))
                    .toList();
            for (Scored s : fullCoverage) {
                if (picks.size() >= need) {
                    break;
                }
                if (seen.add(s.restaurant().getId())) {
                    picks.add(new Pick(s, s.bestMenu(), true));
                }
            }
        }

        // 2단계 — 라운드로빈: 라운드 r = 각 메뉴의 (r+1)등. 이미 뽑힌 식당은 건너뛴다.
        int maxRounds = byMenu.values().stream().mapToInt(List::size).max().orElse(0);
        for (int round = 0; round < maxRounds && picks.size() < need; round++) {
            for (String menu : queried) {
                if (picks.size() >= need) {
                    break;
                }
                List<Scored> ranked = byMenu.get(menu);
                if (round < ranked.size()) {
                    Scored s = ranked.get(round);
                    if (seen.add(s.restaurant().getId())) {
                        picks.add(new Pick(s, menu, false));
                    }
                }
            }
        }

        List<RecoResult.Ranked> recommendations = new ArrayList<>();
        int recLimit = Math.min(MAX_RECOMMENDATIONS, picks.size());

        for (int i = 0; i < recLimit; i++) {
            Pick p = picks.get(i);

            List<String> quoteList = List.of();
            if (p.snippet() != null && !p.snippet().isBlank()) {
                quoteList = List.of(p.snippet().split("\n"));
            }

            recommendations.add(new RecoResult.Ranked(
                    p.scored().restaurant(), i + 1, p.count(),
                    recReason(p, multi), quoteList, "추천"));
        }

        List<RecoResult.Held> held = new ArrayList<>();
        for (int i = recLimit; i < picks.size(); i++) {
            Pick p = picks.get(i);
            held.add(new RecoResult.Held(p.scored().restaurant(), heldReason(p, multi)));
        }

        return new RecoResult(recommendations, held);
    }

    private static String recReason(Pick p, boolean multi) {
        if (p.full()) {
            return "요청한 메뉴 모두 후기 확인 — " + perMenuBreakdown(p.scored());
        }
        String base = "'" + p.menu() + "' 관련 리뷰가 " + p.count() + "건 확인됨";
        if (multi && p.scored().coverage() > 1) {
            base += " · " + p.scored().coverage() + "개 메뉴 커버";
        }
        return base;
    }

    private static String heldReason(Pick p, boolean multi) {
        if (p.full()) {
            return "모든 메뉴 후기 확인 — " + perMenuBreakdown(p.scored());
        }
        String base = "'" + p.menu() + "' 후기 " + p.count() + "건";
        if (multi && p.scored().coverage() > 1) {
            base += " · " + p.scored().coverage() + "개 메뉴";
        }
        return base;
    }

    /** "'짜장' 120건 · '짬뽕' 85건" 형태의 메뉴별 근거 나열(요청 순서 유지). */
    private static String perMenuBreakdown(Scored s) {
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, Integer> e : s.perCount().entrySet()) {
            if (e.getValue() <= 0) {
                continue;
            }
            if (sb.length() > 0) {
                sb.append(" · ");
            }
            sb.append("'").append(e.getKey()).append("' ").append(e.getValue()).append("건");
        }
        return sb.toString();
    }

    private static Scored scoreOne(Restaurant restaurant, List<String> menus) {
        int coverage = 0;
        Map<String, Integer> perCount = new LinkedHashMap<>();
        Map<String, Integer> perCrawled = new LinkedHashMap<>();
        Map<String, String> perSnippet = new LinkedHashMap<>();

        for (String menu : menus) {
            String query = normalize(menu);
            int menuTotal = 0;
            int menuCrawled = 0; // 크롤 실측만 — 커버리지 게이트 판정용
            int menuBestCount = -1;
            String menuSnippet = null;
            for (RestaurantMenuSignal signal : restaurant.getSignals()) {
                String signalMenu = normalize(signal.getMenu());
                if (signalMenu.isEmpty()) {
                    continue;
                }
                if (signalMenu.contains(query) || query.contains(signalMenu)) {
                    menuTotal += signal.getMentionCount();
                    if (!signal.isUserContributed()) {
                        menuCrawled += signal.getMentionCount();
                    }
                    if (signal.getMentionCount() > menuBestCount) {
                        menuBestCount = signal.getMentionCount();
                        menuSnippet = signal.getSnippet();
                    }
                }
            }
            perCount.put(menu, menuTotal);
            perCrawled.put(menu, menuCrawled);
            perSnippet.put(menu, menuSnippet);
            if (menuTotal > 0) {
                coverage++;
            }
        }
        return new Scored(restaurant, coverage, perCount, perCrawled, perSnippet);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.toLowerCase().replaceAll("\\s+", "");
    }

    private record Scored(Restaurant restaurant, int coverage,
                          Map<String, Integer> perCount, Map<String, Integer> perCrawled,
                          Map<String, String> perSnippet) {
        int count(String menu) {
            return perCount.getOrDefault(menu, 0);
        }

        /** 크롤 실측 후기 수 — 사용자 제보 제외(커버리지 게이트용). */
        int crawledCount(String menu) {
            return perCrawled.getOrDefault(menu, 0);
        }

        int totalCount() {
            return perCount.values().stream().mapToInt(Integer::intValue).sum();
        }

        /** 가장 약한 메뉴의 후기 수 — "둘 다 되는 집" 정렬 기준. */
        int minCount() {
            return perCount.values().stream().mapToInt(Integer::intValue).min().orElse(0);
        }

        /** 후기가 가장 많은 메뉴 — 커버리지 픽의 대표 스니펫 선택용. */
        String bestMenu() {
            return perCount.entrySet().stream()
                    .max(Map.Entry.comparingByValue())
                    .map(Map.Entry::getKey)
                    .orElse(null);
        }
    }

    /** 뽑힌 한 곳. full=true 면 요청 메뉴 전부를 커버해 뽑힌 곳(1단계), 아니면 menu 대표(라운드로빈). */
    private record Pick(Scored scored, String menu, boolean full) {
        int count() {
            return full ? scored.totalCount() : scored.count(menu);
        }

        /** 커버리지 픽은 메뉴별 근거를 줄바꿈으로 모두 보여준다 — "둘 다 잘한다"의 증거가 한 줄씩. */
        String snippet() {
            if (!full) {
                return scored.perSnippet().get(menu);
            }
            StringBuilder sb = new StringBuilder();
            for (String s : scored.perSnippet().values()) {
                if (s == null || s.isBlank()) {
                    continue;
                }
                if (sb.length() > 0) {
                    sb.append("\n");
                }
                sb.append(s);
            }
            return sb.length() > 0 ? sb.toString() : scored.perSnippet().get(menu);
        }
    }
}

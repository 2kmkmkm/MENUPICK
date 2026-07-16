package com.menupick.be.ai;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import com.menupick.be.Restaurant.entity.Restaurant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;

/**
 * Optional recommender that enriches the deterministic ranking with LLM-written reasons.
 *
 * <p>Only active when {@code menupick.ai=openai}. If {@code OPENAI_API_KEY} is absent or the
 * remote call fails, it transparently falls back to the deterministic {@link SignalScorer}
 * result, so it never blocks a request and never touches the network at startup.
 */
@Service
@ConditionalOnProperty(name = "menupick.ai", havingValue = "openai")
public class OpenAiAiService implements AiService {

    private static final Logger log = LoggerFactory.getLogger(OpenAiAiService.class);
    private static final String ENDPOINT = "https://api.openai.com/v1/chat/completions";

    private final String apiKey;
    private final String model;
    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    public OpenAiAiService(
            @Value("${spring.ai.openai.api-key}") String apiKey,
            @Value("${spring.ai.openai.chat.model}") String model) {
        this.apiKey = apiKey;
        this.model = model;
    }

    @Override
    public RecoResult recommend(List<String> menus, List<Restaurant> candidatesWithSignals) {
        RecoResult base = SignalScorer.score(menus, candidatesWithSignals);
        if (apiKey == null || apiKey.isBlank() || base.recommendations().isEmpty()) {
            return base;
        }
        try {
            List<String> reasons = rewriteReasons(menus, base.recommendations());
            if (reasons.size() != base.recommendations().size()) {
                return base;
            }
            List<RecoResult.Ranked> enriched = new ArrayList<>();
            for (int i = 0; i < reasons.size(); i++) {
                RecoResult.Ranked r = base.recommendations().get(i);
                enriched.add(new RecoResult.Ranked(
                        r.restaurant(), r.rankNo(), r.evidenceCount(),
                        reasons.get(i), r.quote(), r.verdict()));
            }
            return new RecoResult(enriched, base.onHold());
        } catch (Exception ex) {
            log.warn("OpenAI enrichment failed, using deterministic reasons: {}", ex.getMessage());
            return base;
        }
    }

    private List<String> rewriteReasons(List<String> menus, List<RecoResult.Ranked> ranked) throws Exception {
        StringBuilder prompt = new StringBuilder();
        prompt.append("사용자가 찾는 메뉴: ").append(String.join(", ", menus)).append("\n후보 식당과 근거:\n");
        for (RecoResult.Ranked r : ranked) {
            prompt.append("- ").append(r.restaurant().getName())
                    .append(" (근거: ").append(r.reason()).append(")\n");
        }
        prompt.append("각 식당을 추천하는 한 문장 이유를 한국어로 작성해, "
                + "{\"reasons\":[...]} JSON 객체로만 응답해줘. 배열 길이는 후보 수와 같아야 해.");

        ObjectNode body = mapper.createObjectNode();
        body.put("model", model);
        body.put("temperature", 0.4);
        ArrayNode messages = body.putArray("messages");
        ObjectNode user = messages.addObject();
        user.put("role", "user");
        user.put("content", prompt.toString());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(ENDPOINT))
                .timeout(Duration.ofSeconds(20))
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                .build();

        HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString());
        JsonNode root = mapper.readTree(response.body());
        String content = root.path("choices").path(0).path("message").path("content").asText("");
        JsonNode parsed = mapper.readTree(content);

        List<String> reasons = new ArrayList<>();
        for (JsonNode node : parsed.path("reasons")) {
            reasons.add(node.asText());
        }
        return reasons;
    }
}


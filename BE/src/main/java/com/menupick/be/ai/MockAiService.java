package com.menupick.be.ai;

import java.util.List;

import com.menupick.be.Restaurant.entity.Restaurant;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;


/** Default offline recommender driven purely by the seeded menu signals. */
@Service
@Primary
@ConditionalOnProperty(name = "menupick.ai", havingValue = "mock", matchIfMissing = true)
public class MockAiService implements AiService {

    @Override
    public RecoResult recommend(List<String> menus, List<Restaurant> candidatesWithSignals) {
        return SignalScorer.score(menus, candidatesWithSignals);
    }
}

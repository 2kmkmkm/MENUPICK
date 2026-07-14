package com.menupick.be.ai;

import com.menupick.be.Restaurant.entity.Restaurant;

import java.util.List;

public interface AiService {
    /**
     * Ranks the given candidates for the requested menus.
     *
     * @param menus                  the menus the user is searching for (one or more)
     * @param candidatesWithSignals  candidate restaurants (already within radius) with signals loaded
     */
    RecoResult recommend(List<String> menus, List<Restaurant> candidatesWithSignals);
}

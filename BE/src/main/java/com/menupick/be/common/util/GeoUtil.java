package com.menupick.be.common.util;

public final class GeoUtil {

    private static final double EARTH_RADIUS_M = 6_371_000.0;

    private GeoUtil() {
    }

    /** Great-circle distance between two coordinates, in meters. */
    public static long haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS_M * c);
    }
}

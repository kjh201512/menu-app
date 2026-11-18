package com.menuapp.recommendation;
public final class GeoDistance {
    public static final double EARTH_RADIUS_METERS=6371000.0;
    private GeoDistance() {}
    public static double meters(double lat1,double lng1,double lat2,double lng2) {
        double dLat=Math.toRadians(lat2-lat1),dLng=Math.toRadians(lng2-lng1);
        double a=Math.pow(Math.sin(dLat/2),2)+Math.cos(Math.toRadians(lat1))*Math.cos(Math.toRadians(lat2))*Math.pow(Math.sin(dLng/2),2);
        return 2*EARTH_RADIUS_METERS*Math.asin(Math.sqrt(Math.min(1,Math.max(0,a))));
    }
}

package com.menuapp.restaurant;

import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class MapLinkBuilder {

    public String googleMapUrl(double latitude, double longitude) {
        return String.format(Locale.ROOT, "https://www.google.com/maps/search/?api=1&query=%.6f,%.6f", latitude, longitude);
    }
}
package com.menuapp.restaurant;

import java.time.LocalTime;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

public final class BusinessHours {

    public enum Status {
        OPEN("영업 중"), CLOSED("영업 종료"), UNKNOWN("정보 없음");

        private final String label;

        Status(String label) { this.label = label; }

        public String label() { return label; }
    }

    private static final Pattern RANGE = Pattern.compile("^([01]\\d|2[0-3]):([0-5]\\d)-([01]\\d|2[0-4]):([0-5]\\d)$");

    private BusinessHours() {
    }

    public static boolean isValid(String raw) {
        return raw != null && RANGE.matcher(raw.strip()).matches();
    }

    public static Status statusAt(String raw, LocalTime now) {
        if (!isValid(raw)) return Status.UNKNOWN;
        Matcher m = RANGE.matcher(raw.strip());
        m.matches();
        int open = Integer.parseInt(m.group(1)) * 60 + Integer.parseInt(m.group(2));
        int close = Integer.parseInt(m.group(3)) * 60 + Integer.parseInt(m.group(4));
        int current = now.getHour() * 60 + now.getMinute();
        if (open == close) return Status.OPEN;
        boolean opened = open < close
                ? current >= open && current < close
                : current >= open || current < close;
        return opened ? Status.OPEN : Status.CLOSED;
    }
}
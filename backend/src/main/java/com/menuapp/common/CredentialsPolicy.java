package com.menuapp.common;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.regex.Pattern;
/** 이메일은 trim/lowercase 처리하지만 비밀번호는 원문을 그대로 비교합니다. */
public final class CredentialsPolicy {
    private static final Pattern EMAIL = Pattern.compile("^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?)+$");
    private CredentialsPolicy() {}
    public static String normalizeEmail(String email) {
        return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
    }
    public static boolean validEmail(String value) {
        if (value == null || value.length() > 254 || !EMAIL.matcher(value).matches()) return false;
        int at = value.indexOf('@');
        String local = value.substring(0, at);
        if (local.length() > 64 || local.startsWith(".") || local.endsWith(".") || local.contains("..")) return false;
        for (String label : value.substring(at + 1).split("\\.")) {
            if (label.length() > 63) return false;
        }
        return true;
    }
    public static boolean validPassword(String password) {
        return password != null && password.codePointCount(0, password.length()) >= 8
            && !password.isBlank() && password.getBytes(StandardCharsets.UTF_8).length <= 72;
    }
}

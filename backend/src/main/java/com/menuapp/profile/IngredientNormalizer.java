package com.menuapp.profile;
import java.text.Normalizer;
import java.util.Locale;
import java.util.Map;
/** 데이터에 명시된 식재료의 보수적 정규화일 뿐 의료용 알레르겐 판별기가 아닙니다. */
public final class IngredientNormalizer {
    private IngredientNormalizer() {}
    private static final Map<String, String> ALIASES = Map.ofEntries(
        Map.entry("계란", "달걀"), Map.entry("난류", "달걀"), Map.entry("egg", "달걀"), Map.entry("eggs", "달걀"),
        Map.entry("milk", "우유"), Map.entry("밀가루", "밀"), Map.entry("wheat", "밀"),
        Map.entry("콩", "대두"), Map.entry("soy", "대두"), Map.entry("soybean", "대두"),
        Map.entry("peanut", "땅콩"), Map.entry("shrimp", "새우"), Map.entry("pork", "돼지고기"), Map.entry("beef", "소고기")
    );
    public static String normalize(String raw) {
        if (raw == null) return "";
        StringBuilder clean = new StringBuilder();
        Normalizer.normalize(raw, Normalizer.Form.NFKC).toLowerCase(Locale.ROOT).codePoints()
            .filter(c -> !Character.isWhitespace(c) && !Character.isSpaceChar(c)).forEach(clean::appendCodePoint);
        String value = clean.toString();
        return ALIASES.getOrDefault(value, value);
    }
    public static boolean conflicts(String ingredient, String restriction) {
        String a = normalize(ingredient), b = normalize(restriction);
        return !a.isEmpty() && !b.isEmpty() && (a.contains(b) || b.contains(a));
    }
}

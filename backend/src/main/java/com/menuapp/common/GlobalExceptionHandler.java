package com.menuapp.common;
import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.converter.HttpMessageNotReadableException;
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    @ExceptionHandler(ApiException.class)
    ResponseEntity<ApiError> api(ApiException e) {
        return ResponseEntity.status(e.getStatus()).body(ApiError.of(e.getCode(), e.getMessage()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiError> validation(MethodArgumentNotValidException e) {
        Map<String, String> errors = new LinkedHashMap<>();
        e.getBindingResult().getFieldErrors().forEach(f -> errors.putIfAbsent(f.getField(), f.getDefaultMessage()));
        return ResponseEntity.badRequest().body(new ApiError("VALIDATION_ERROR", "입력값을 확인해 주세요.", errors, Instant.now()));
    }
    @ExceptionHandler(HttpMessageNotReadableException.class)
    ResponseEntity<ApiError> malformed() {
        return ResponseEntity.badRequest().body(ApiError.of("INVALID_JSON", "요청 본문 형식을 확인해 주세요."));
    }
    @ExceptionHandler({org.springframework.web.method.annotation.MethodArgumentTypeMismatchException.class,
        org.springframework.web.bind.MissingServletRequestParameterException.class})
    ResponseEntity<ApiError> queryParameter(Exception e) {
        return ResponseEntity.badRequest().body(ApiError.of("INVALID_PARAMETERS", "필수 쿼리 파라미터와 숫자 형식을 확인해 주세요."));
    }
    @ExceptionHandler(org.springframework.web.HttpRequestMethodNotSupportedException.class)
    ResponseEntity<ApiError> methodNotAllowed() {
        return ResponseEntity.status(405).body(ApiError.of("METHOD_NOT_ALLOWED", "지원하지 않는 요청 방식입니다."));
    }
    @ExceptionHandler(org.springframework.web.servlet.resource.NoResourceFoundException.class)
    ResponseEntity<ApiError> notFound() {
        return ResponseEntity.status(404).body(ApiError.of("NOT_FOUND", "요청한 경로가 없습니다."));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<ApiError> unexpected(Exception e) {
        // 비밀번호/요청 본문/토큰은 기록하지 않습니다. DB 오류 문구도 외부에 노출하지 않습니다.
        log.error("Unhandled request error: {}", e.getClass().getName());
        return ResponseEntity.internalServerError().body(ApiError.of("INTERNAL_ERROR", "서버 오류가 발생했습니다. 잠시 후 다시 시도해 주세요."));
    }
}

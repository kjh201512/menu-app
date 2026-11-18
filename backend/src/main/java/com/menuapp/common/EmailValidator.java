package com.menuapp.common;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
public class EmailValidator implements ConstraintValidator<ValidEmail, String> {
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return CredentialsPolicy.validEmail(value);
    }
}

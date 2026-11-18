package com.menuapp.common;
import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
public class PasswordValidator implements ConstraintValidator<ValidPassword, String> {
    public boolean isValid(String value, ConstraintValidatorContext context) {
        return CredentialsPolicy.validPassword(value);
    }
}

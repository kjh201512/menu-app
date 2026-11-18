ALTER TABLE users ADD COLUMN restrictions_completed BOOLEAN NOT NULL DEFAULT FALSE;
CREATE TABLE user_preference (
    pref_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    category VARCHAR(30) NOT NULL,
    weight DOUBLE NOT NULL,
    CONSTRAINT uk_preference_user_category UNIQUE (user_id, category),
    CONSTRAINT fk_preference_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE user_restriction (
    restriction_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ingredient_name VARCHAR(50) NOT NULL,
    type VARCHAR(20) NOT NULL,
    CONSTRAINT uk_restriction_user_ingredient UNIQUE (user_id, ingredient_name),
    CONSTRAINT fk_restriction_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
CREATE TABLE restaurant (
    restaurant_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    external_place_id VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE NOT NULL,
    longitude DOUBLE NOT NULL,
    category VARCHAR(30) NOT NULL,
    business_hours VARCHAR(100),
    CONSTRAINT uk_restaurant_external_id UNIQUE (external_place_id)
);
CREATE INDEX ix_restaurant_latitude ON restaurant(latitude);
CREATE TABLE menu (
    menu_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    restaurant_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(30) NOT NULL,
    price INTEGER NOT NULL,
    is_signature BOOLEAN NOT NULL,
    ingredients_complete BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_menu_restaurant FOREIGN KEY (restaurant_id) REFERENCES restaurant(restaurant_id) ON DELETE CASCADE
);
CREATE TABLE menu_ingredient (
    menu_ingredient_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    menu_id BIGINT NOT NULL,
    ingredient_name VARCHAR(50) NOT NULL,
    CONSTRAINT fk_ingredient_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE,
    CONSTRAINT uk_menu_ingredient UNIQUE (menu_id, ingredient_name)
);
CREATE TABLE recommendation_log (
    log_id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    menu_id BIGINT NOT NULL,
    session_id VARCHAR(36) NOT NULL,
    status VARCHAR(20) NOT NULL,
    created_at TIMESTAMP(6) NOT NULL,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_log_menu FOREIGN KEY (menu_id) REFERENCES menu(menu_id) ON DELETE CASCADE
);
CREATE INDEX ix_log_user_session ON recommendation_log(user_id, session_id);

package com.menuapp.recommendation;
import com.menuapp.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
@Entity @Table(name="recommendation_log")
public class RecommendationLog {
    public enum Status { SHOWN, REJECTED, SELECTED }
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) @Column(name="log_id") private Long id;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="user_id",nullable=false) private User user;
    @ManyToOne(fetch=FetchType.LAZY,optional=false) @JoinColumn(name="menu_id",nullable=false) private Menu menu;
    @Column(name="session_id",nullable=false,length=36) private String sessionId;
    @Enumerated(EnumType.STRING) @Column(nullable=false,length=20) private Status status;
    @JdbcTypeCode(SqlTypes.TIMESTAMP) @Column(name="created_at",nullable=false) private Instant createdAt;
    protected RecommendationLog() {}
    public RecommendationLog(User user,Menu menu,String sessionId) { this.user=user;this.menu=menu;this.sessionId=sessionId;this.status=Status.SHOWN;this.createdAt=Instant.now(); }
}

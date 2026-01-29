package com.projectmanagement.core_system.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "database_sequences")
public class DatabaseSequence {

    @Id
    private String id; // Tên của bảng cần đếm (ví dụ: "users", "projects")
    private long seq;  // Số hiện tại (ví dụ: 5)

    public DatabaseSequence() {}

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public long getSeq() { return seq; }
    public void setSeq(long seq) { this.seq = seq; }
}
package com.treasure.server.common;

import lombok.Data;

/**
 * 统一响应结果类
 */
@Data
public class Result<T> {
    
    private Integer code;
    private String message;
    private T data;
    
    private Result() {
    }
    
    private Result(Integer code, String message, T data) {
        this.code = code;
        this.message = message;
        this.data = data;
    }
    
    /**
     * 成功返回结果
     */
    public static <T> Result<T> success() {
        return new Result<>(0, "操作成功", null);
    }
    
    /**
     * 成功返回结果
     */
    public static <T> Result<T> success(T data) {
        return new Result<>(0, "操作成功", data);
    }
    
    /**
     * 成功返回结果
     */
    public static <T> Result<T> success(String message, T data) {
        return new Result<>(0, message, data);
    }
    
    /**
     * 失败返回结果
     */
    public static <T> Result<T> error() {
        return new Result<>(-1, "操作失败", null);
    }
    
    /**
     * 失败返回结果
     */
    public static <T> Result<T> error(String message) {
        return new Result<>(-1, message, null);
    }
    
    /**
     * 失败返回结果
     */
    public static <T> Result<T> error(Integer code, String message) {
        return new Result<>(code, message, null);
    }
} 